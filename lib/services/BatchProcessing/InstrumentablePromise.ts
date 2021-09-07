export class InstrumentablePromise {
  promise: Promise<any>;
  resolve: (...any) => any;
  reject: (...any) => any;

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
