import { synchronized } from "../lib"

class Runner {
  private taskId: number
  
  constructor(taskId: number) {
    this.taskId = taskId
  }

  // Synchronized works on methods.
  @synchronized
  public async run() {
    console.log(`Begin ${this.taskId}`)

    // Do some work.
    await new Promise((res, rej) => {
      setTimeout(res, 2000 * Math.random())
    })

    console.log(`End ${this.taskId}`)
  }
}

async function execute() {

  const promises: Promise<void>[] = []

  // Introduce concurrency.
  for(let i = 0; i < 10; i++) {
    promises.push(new Runner(i).run())
  }

  await Promise.all(promises)

  // Program output:
  // Begin 0
  // End 0
  // Begin 1
  // End 1
  // Begin 2
  // End 2
  // Begin 3
  // End 3
  // Begin 4
  // End 4
  // Begin 5
  // End 5
  // Begin 6
  // End 6
  // Begin 7
  // End 7
  // Begin 8
  // End 8
  // Begin 9
  // End 9
}

execute()