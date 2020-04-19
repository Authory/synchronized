import { MutexLibrary } from "../lib"

/**
 * In this example, we use a dictionary of mutexes
 * to synchronize a specific API call on a per-user basis.
 * This means the call will never be executed concurrently for the
 * same user, but it can be executed concurrently for different users.
 */
const synchronizePayment = new MutexLibrary<number>()

app.post('/payment/:userId?', async (ctx: any) => {

  const userId = ctx.params.userId

  const res = await synchronizePayment.by(userId).sync(async () => {
    // Do dangerous things that can never race.
    return 0
  })

  ctx.response.body = { res }
  ctx.response.status = 200
})