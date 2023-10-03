/**
 * This recovery queue has been made by the paas team here https://github.com/kuzzleio/paas-console/blob/master/apps/api/lib/api/RecoveryQueue.ts
 * The RecoveryQueue allows you to store action to perform later and trigger
 * all of it at once.
 */
export class RecoveryQueue {
  // eslint-disable-next-line @typescript-eslint/ban-types
  private actions: Function[];

  constructor() {
    this.actions = [];
  }

  /**
   * The addRecovery function adds a recovery function to an array of actions.
   * @param {any} func - The `func` parameter is a function that you want to add to the `actions` array.
   */
  addRecovery(func: any) {
    this.actions.push(func);
  }

  /**
   * The "reset" function clears the "actions" array.
   */
  reset() {
    this.actions = [];
  }

  /**
   * The `rollback` function iterates through a list of actions in reverse order and attempts to execute
   * each action, logging any errors encountered.
   */
  async rollback() {
    for (const action of this.actions.reverse()) {
      try {
        await action();
      } catch (error) {
        global.app.log.error(`
          Rollback process failed: ${error}
        `);
      }
    }
  }
}
