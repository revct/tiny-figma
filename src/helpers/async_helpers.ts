
export const asyncSleep = async (ms: number): Promise<any> => {
  return new Promise((resolve, reject)=> {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}