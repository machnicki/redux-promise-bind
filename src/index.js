// @flow

const extendBy = (object: Object, { metadata } : { metadata : any }) => {
  if (metadata) return { ...object, metadata }
  return object
}

const promisesInQueue = {}

const runPromisesInQueue = (groupName: string) => {
  if (promisesInQueue[groupName].length) {
    const promiseInQueue = promisesInQueue[groupName][0]
    promiseInQueue.callback().then((...successPayload) => {
      promiseInQueue.success(...successPayload)
      promisesInQueue[groupName].splice(0, 1)
      runPromisesInQueue(groupName)
    }, (...rejectPayload) => promiseInQueue.reject(...rejectPayload))
  }
}

const addPromiseToQueue = (groupName, callback) => {
  let promiseInQueue
  const promise = new Promise((success, reject) => {
    promiseInQueue = { callback, success, reject }
  })

  if (!(promisesInQueue[groupName] && promisesInQueue[groupName].length)) {
    promisesInQueue[groupName] = [promiseInQueue]
    runPromisesInQueue(groupName)
  } else {
    promisesInQueue[groupName].push(promiseInQueue)
  }

  return promise
}

const promiseBindMiddleware = (
  { dispatch } : { dispatch: Function },
) => (next: Function) => (action: Object) => {
  if (action && action.promise && typeof action.promise === 'function') {
    const { type, metadata, promise, promiseArg, logic, group } = action

    const dispatchPromise = () => {
      dispatch(extendBy({
        type: `${type}_START`,
      }, { metadata }))

      return promise(...(Array.isArray(promiseArg) ? promiseArg : [promiseArg]))
        .then((data) => {
          dispatch(extendBy({
            type: `${type}_SUCCESS`,
            payload: data,
          }, { metadata }))

          return data
        }, (ex) => {
          dispatch(extendBy({
            type: `${type}_ERROR`,
            payload: ex,
          }, { metadata }))

          // TODO change to throw an error
          return ex
        })
    }

    switch (logic) {
      case 'inQueue':
        return addPromiseToQueue(group, dispatchPromise)
      default:
        return dispatchPromise()
    }
  }
  return next(action)
}

export default promiseBindMiddleware
