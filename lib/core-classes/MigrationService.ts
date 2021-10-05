import { PluginContext, Plugin } from 'kuzzle';
import { DeviceManagerConfig } from '../DeviceManagerPlugin';

export class MigrationService {
  private config: DeviceManagerConfig;
  private context: PluginContext;

  private prefix: string

  get sdk () {
    return this.context.accessors.sdk;
  }

  constructor (pluginName: string, plugin: Plugin) {
    this.config = plugin.config as any;
    this.context = plugin.context;

    this.prefix = pluginName;
  }

  async run () {
    global.app.install(`${this.prefix}-O.3.0`, async () => {
      await this.engineCollection();
    });
  }

  /**
   * Migrate the engine documents into the new config collection
   */
  private async engineCollection () {
    if (! await this.sdk.collection.exists(this.config.adminIndex, 'engines')) {
      return;
    }

    this.context.log.info('Migrate engine documents into the config collection...');

    let result = await this.sdk.document.search(
      this.config.adminIndex,
      'engines',
      {},
      { scroll: '1s', size: 100 });

    let count = 0;
    while (result) {
      const documents = [];

      for (const { _id, _source } of result.hits) {
        documents.push({
          _id,
          body: {
            type: 'engine-device-manager',
            engine: { index: _source.index },
          },
        });
      }

      await this.sdk.document.mCreate(
        this.config.adminIndex,
        this.config.configCollection,
        documents,
        {
          strict: true,
        });

      count += documents.length;

      result = await result.next();
    }

    this.context.log.info(`Successfully migrated ${count} documents.`);
  }
}
