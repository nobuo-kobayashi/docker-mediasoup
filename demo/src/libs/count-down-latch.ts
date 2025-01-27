export class CountDownLatch {
  private callCount:number;
  private resolve:any;
  private promise:Promise<void>;

  constructor(callCount = 1) {
    this.callCount = callCount;
    this.resolve = null;
    this.promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  countDown() {
    this.callCount--;
    if (this.callCount <= 0) {
      this.resolve();
    }
  }

  async wait(timeout?:number): Promise<void> {
    if (this.callCount <= 0) {
      return Promise.resolve();
    }

    if (timeout !== undefined) {
      return Promise.race([
        this.promise,
        new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, timeout);
        })
      ]);
    }

    return this.promise;
  }
}
