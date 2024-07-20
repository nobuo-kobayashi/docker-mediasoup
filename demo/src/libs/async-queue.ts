
export type AsyncTask = () => Promise<void>;

export class AsyncQueue {
  private queue: AsyncTask[] = [];
  private processing = false;

  clear(): void {
    this.queue = [];
  }

  enqueue(task: AsyncTask): void {
    this.queue.push(task);
    this.processNextTask();
  }

  private async processNextTask() {
    if (this.processing) {
      return;
    }
    if (this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const task = this.queue.shift();
    if (task) {
      await task().catch((error) => {
        if (error) {
          console.error('Unknown error.', error);
        }
      });
    }
    this.processing = false;
    this.processNextTask();
  }
}
