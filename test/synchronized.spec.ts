import { Synchronized, SynchronizedBy, synchronized } from '../lib/'

let taskCreationOrder = []
let taskStartOrder = []
let taskResolveOrder = []

const resetTaskStats = () => {
  taskCreationOrder = []
  taskStartOrder = []
  taskResolveOrder = []
}

const taskGen = (id: number, duration: number) => {
  console.log(`Creating Task ${id}`)
  taskCreationOrder.push(id)
  // Returning a promise directly would start execution
  return () => new Promise<number>((resolve, reject) => {
    console.log(`Started ${id}`)
    taskStartOrder.push(id)
    setTimeout(() => {
      console.log(`Resolving ${id}`)
      taskResolveOrder.push(id)
      resolve(id)
    }, duration)
  })
}

describe("Synchronization helper", () => {

  beforeEach(resetTaskStats)

  it("Should synchronize trivial sequence", async () => {
    const sync = new Synchronized<number>()

    const results = await Promise.all([
      sync.sync(taskGen(0, 500)),
      sync.sync(taskGen(1, 500)),
      sync.sync(taskGen(2, 500)),
      sync.sync(taskGen(3, 500)),
      sync.sync(taskGen(4, 500)),
      sync.sync(taskGen(5, 500))
    ])

    const order = [0, 1, 2, 3, 4, 5]

    expect(results).toEqual(order)
    expect(taskCreationOrder).toEqual(order)
    expect(taskStartOrder).toEqual(order)
    expect(taskResolveOrder).toEqual(order)
  })

  it("Should synchronize different length", async () => {
    const sync = new Synchronized<number>()

    const results = await Promise.all([
      sync.sync(taskGen(0, 1000)),
      sync.sync(taskGen(1, 0)),
      sync.sync(taskGen(2, 100)),
      sync.sync(taskGen(3, 10)),
      sync.sync(taskGen(4, 500)),
      sync.sync(taskGen(5, 10))
    ])

    const order = [0, 1, 2, 3, 4, 5]

    expect(results).toEqual(order)
    expect(taskCreationOrder).toEqual(order)
    expect(taskStartOrder).toEqual(order)
    expect(taskResolveOrder).toEqual(order)
  })

  it("Should restart safely", async () => {
    const sync = new Synchronized<number>()

    const results = await Promise.all([
      sync.sync(taskGen(0, 1000)),
      sync.sync(taskGen(1, 0)),
      sync.sync(taskGen(2, 100))
    ])

    expect(results).toEqual([0, 1, 2])

    const results2 = await Promise.all([
      sync.sync(taskGen(3, 10)),
      sync.sync(taskGen(4, 500)),
      sync.sync(taskGen(5, 10))
    ])

    expect(results2).toEqual([3, 4, 5])

    const order = [0, 1, 2, 3, 4, 5]

    expect(taskCreationOrder).toEqual(order)
    expect(taskStartOrder).toEqual(order)
    expect(taskResolveOrder).toEqual(order)
  })

  it("Should work with chains", async () => {
    const sync = new Synchronized<number[]>()

    const p1 = sync.sync(async () => {
      return [
        await taskGen(0, 1000)(),
        await taskGen(1, 100)(),
        await taskGen(2, 100)(),
      ]
    })

    const p2 = sync.sync(async () => {
      return [
        await taskGen(3, 300)(),
        await taskGen(4, 10)(),
        await taskGen(5, 10)(),
      ]
    })

    const [results1, results2] = await Promise.all([p1, p2])

    expect(results1).toEqual([0, 1, 2])
    expect(results2).toEqual([3, 4, 5])

    const order = [0, 1, 2, 3, 4, 5]

    expect(taskCreationOrder).toEqual(order)
    expect(taskStartOrder).toEqual(order)
    expect(taskResolveOrder).toEqual(order)
  })



  it("Synchronized should forward errors correctly", async () => {
    const sync = new Synchronized<void>()

    const p1 = sync.sync(async () => {
      throw 'p1'
    })

    const p2 = sync.sync(async () => {
      throw 'p2'
    })

    await expect(p1).rejects.toEqual('p1')
    await expect(p2).rejects.toEqual('p2')
  })


  it("Synchronization directory should work", async () => {
    const library = new SynchronizedBy<void>()

    expect(library.by(0)).toBe(library.by(0))
    expect(library.by(0)).not.toBe(library.by(1))
    expect(library.by(1)).toBe(library.by(1))
  })

  it("Synchronized decorator should work", async() => {
    class Task {
      constructor() { }

      @synchronized
      async doWork(id: number, duration: number) {
        return await taskGen(id, duration)()
      }
    }

    const task = new Task()

    const results = await Promise.all([
      task.doWork(0, 1000),
      task.doWork(1, 0),
      task.doWork(2, 100),
      task.doWork(3, 10),
      task.doWork(4, 500),
      task.doWork(5, 10)
    ])

    const order = [0, 1, 2, 3, 4, 5]

    expect(results).toEqual(order)
    expect(taskCreationOrder).toEqual(order)
    expect(taskStartOrder).toEqual(order)
    expect(taskResolveOrder).toEqual(order)
  })
})