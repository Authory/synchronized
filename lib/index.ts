
type Callback<T> = () => T | PromiseLike<T>
type Resolve<T> = (value?: T | PromiseLike<T>) => void

/**
 * Mutex. Makes sure a certain function 
 * is not executed concurrently, even if it contains async operations..
 */
export class Mutex<ResType> {
  private queue: { 
    // This is not a promise on purpose, as a
    // promise execution starts with the promise creation.
    fun: Callback<ResType>,
    resolve: Resolve<ResType> 
    reject: Resolve<Error>
  }[]

  constructor() {
    this.queue = []
  }

  /**
   * Makes sure the given callback is executed only after all
   * previous invocations of sync have finished.
   * @param fun The function to call. Can emit a promise.
   */
  public async sync(fun: Callback<ResType>) {
    // Enqueue work.
    const promise = new Promise<ResType>(async (resolve, reject) => {
      this.queue.push({
        fun,
        resolve,
        reject
      })

      // If this promise chain is the first to call,
      // we execute the promise directly.
      if(this.queue.length === 1) {
        // If, while execution of the first chain,
        // another promise was enqueued, the first chain's call
        // is responsible for calling and resolving all enqueed promises.
        // This ensurs promises are not resolved twive.
        while(this.queue.length > 0) {
          const { fun, resolve, reject } = this.queue[0]
          
          try {
            let res = await fun()
            resolve(res)
          } catch(err) {
            reject(err)
          }

          this.queue.shift()
        }
      }
    })

    return promise
  }
}

/**
 * Synchronized decorator which can patch methods on the fly.
 * Only works for methods, not for functions!
 */
export function synchronized(target, methodName: string, descriptor) {

  const sync = new Mutex()

  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, methodName);
  }

  var originalMethod = descriptor.value;

  descriptor.value = function(...args) {
    return sync.sync(() => originalMethod.apply(this, args))
  }

  return descriptor;
}

/**
 * Dictionary of mutexes.
 */
export class MutexLibrary<ResType> {
  private dict: { [key: number]: Mutex<ResType> }

  constructor() {
    this.dict = { }
  }

  /**
   * Fetches a mutex for the given key.
   * @param key The key.
   */
  public by(key: number) {
    if(this.dict[key] === undefined) {
      this.dict[key] = new Mutex<ResType>()
    }

    return this.dict[key]
  }
}