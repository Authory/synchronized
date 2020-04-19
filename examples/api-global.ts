import { Mutex } from "../lib"

/**
 * In this example, we use a global mutex.
 * Signup will never execute concurrently.
 */
const synchronizePayment = new Mutex<number>()

app.post('/signup/', async (ctx: any) => {

  const userId = ctx.params.userId

  const res = await synchronizePayment.sync(async () => {
    // Do dangerous things that can never race.
    return 0
  })

  ctx.response.body = { res }
  ctx.response.status = 200
})