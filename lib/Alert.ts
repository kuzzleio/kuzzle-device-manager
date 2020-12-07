import util from 'util';

import {
  JSONObject,
  Document,
  InternalError,
  DocumentNotification,
  RequestPayload,
  DocumentContent,
  ScopeOption,
  BadRequestError,
} from 'kuzzle';
import { AlertsEngine, Predicate } from './AlertsEngine';

export interface AlertContent extends DocumentContent {
  name: string;

  description: string;

  type: 'detector';

  trigger: {
    index: string;

    collection: string;

    filters: JSONObject;

    predicates: Array<{
      name: string;

      args: JSONObject;
    }>;
  }

  actions: Array<{
    type: 'api';
    request?: RequestPayload
  }>
}

export class Alert extends Document {
  public _source: AlertContent;
  public index: string;

  constructor (index: string, document: any) {
    super();

    this._id = document._id;
    this._source = document._source;
    this.index = index;
  }

  get sdk () {
    return Alert.plugin.context.accessors.sdk;
  }

  get context () {
    return Alert.plugin.context;
  }

  get collection () {
    return Alert.collection;
  }

  get plugin () {
    return Alert.plugin;
  }

  /**
   * Starts subscribing to alert trigger
   */
  async subscribe () {
    this.context.log.debug(`Start subscribing to ${this._source.name}`);

    try {
      const roomId = await this.sdk.realtime.subscribe(
        this._source.trigger.index,
        this._source.trigger.collection,
        this._source.trigger.filters,
        async (notification: DocumentNotification) => {
          const document = notification.result;

          try {
            if (! await this.verifyPredicates(document)) {
              return;
            }

            await this.executeActions(document);
          }
          catch (error) {
            this.context.log.error(`[${this.index}] Cannot execute actions for alert "${this._id}": ${util.inspect(error)}`);
          }
        },
        { scope: ScopeOption.in });

      // Save roomId in Redis to unsusbcribe on alert deletion
      await this.sdk.ms.set(Alert.key(this.index, this._id, 'roomId'), roomId);
    }
    catch (error) {
      throw new InternalError(`[${this.index}] Cannot subscribe to alert "${this._id}": ${util.inspect(error)}`);
    }
  }

  /**
   * Executes alert actions
   */
  async executeActions (document: Document) {
    const promises = [];

    const userId = this._source._kuzzle_info.updater
      || this._source._kuzzle_info.author;

    await this.checkActionsRights(userId);

    for (const action of this._source.actions) {
      if (action.type === 'api') {
        const request = {
          ...action.request,
          body: {
            alertId: this._id,
            name: this._source.name,
            description: this._source.description,
            document,
          }
        };

        promises.push(this.sdk.query(request));
      }
    }

    return Promise.all(promises);
  }

  /**
   * Checks if the alert actions are allowed for the given user
   */
  async checkActionsRights (userId: string) {
    if (! this._source.actions) {
      return;
    }

    for (const action of this._source.actions) {
      if (action.type !== 'api') {
        continue;
      }

      const { result: { allowed } } = await this.sdk.query({
        controller: 'security',
        action: 'checkRights',
        body: action.request,
        userId,
      });

      if (! allowed) {
        throw new BadRequestError(`[${this.index}] User "${userId}" does not have the right to execute the API action "${action.request.controller}:${action.request.action}" with the provided arguments.`);
      }
    }
  }

  /**
   * Verify predicate conditions
   *
   * @param document - Document who triggered the alert
   */
  private async verifyPredicates (document: Document): Promise<boolean> {
    const predicates = this._source.trigger.predicates || [];

    for (const { name, args } of predicates) {
      const predicate: Predicate = this.plugin.predicates.get(name);

      if (! await predicate(this._source, document, args)) {
        return false;
      }
    }

    return true;
  }

  /* Static Declarations ==================================================== */

  static plugin: AlertsEngine;
  static collection = 'alerts';

  /**
   * Unsubscribe the alert from the previous trigger.
   * Use the roomId stored in Redis
   */
  static async unsubscribe (index: string, alertId: string) {
    this.context.log.debug(`[${index}] Start unsubscribing from alert "${alertId}"`);

    const roomId = await this.sdk.ms.get(Alert.key(index, alertId, 'roomId'));

    if (roomId === null) {
      this.context.log.debug(`[${index}] No roomId to unsubscribe from alert "${alertId}"`);
      return;
    }

    try {
      await this.sdk.realtime.unsubscribe(roomId);
      await this.sdk.ms.del([Alert.key(index, alertId, 'roomId')]);
    }
    catch (error) {
      if (error.id === 'core.realtime.not_subscribed') {
        await this.sdk.ms.del([Alert.key(index, alertId, 'roomId')]);
      }
      else {
        throw new InternalError(`[${index}] Cannot unsubscribe from alert "${alertId}": ${util.inspect(error)}`);
      }
    }
  }

  static key (index, alertId, suffix) {
    return `alerts-engine/${index}/alerts/${alertId}/${suffix}`;
  }

  static get sdk () {
    return this.plugin.context.accessors.sdk;
  }

  static get context () {
    return this.plugin.context;
  }
}
