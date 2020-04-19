# Mutex and @synchronized for TS

This library provides a mutex that works with async functions. It guarantees that a certain async code section is never executed concurrently. ⚙️⚡

Furthermore, it provides an `@synchronized` decorator for usage in typescript.

### Installation

```bash
yarn add synchronized-ts
# or
npm i synchronized-ts
```

### Usage and Examples

Synchronized decorator:

```ts
class Runner {
  private taskId: number
  
  constructor(taskId: number) { this.taskId = taskId }

  // Synchronized works on methods.
  @synchronized
  public async run() {
    console.log(`Begin ${this.taskId}`)

    // Do some async work.

    console.log(`End ${this.taskId}`)
  }
}
```

Locking based on context:

```ts
const synchronizePayment = new MutexLibrary<number>()

app.post('/payment/:userId?', async (ctx: any) => {
  const userId = ctx.params.userId

  ctx.response.body = await synchronizePayment.by(userId).sync(async () => {
    // Do dangerous things that can never race for a user.
    return 0
  })
})
```

Global locking:

```ts
const synchronizePayment = new Mutex<number>()

app.post('/signup/', async (ctx: any) => {
  ctx.response.body = await synchronizePayment.sync(async () => {
    // Do dangerous things that can never race at all.
    return 0
  })
})
```

For more detailed examples, please look into the `examples` and `test` folders.

### Why should I use this?

Generally speaking, you should always aim for lock-free concurrency mechanisms when building web applications. However, there might be corner cases: I ran into a case with 3rd party APIs, where executing concurrent calls to certain API in the same user context broke things, hence I wrote this library.

### Caveats

* Only works locally, e.g. within a single node instance. For synchronization between different instances or serverless functions, please look into other projects. That's a hard problem though.
