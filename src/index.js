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

type Action = {
  type: string,
  metadata: string,
  promise: Function,
  promiseArg: Array<any>,
  logic: string,
  group: string,
}

type ExtendedAction = {
  initAction: Action,
  startAction: Object,
  successAction: Function,
  errorAction: Function,
}

// TODO prepare onCancel handler

const createStartAction = ({ type, metadata }) => (
  extendBy({
    type: `${type}_START`,
  }, { metadata })
)

const createSuccessAction = ({ type, metadata }) => data => (
  extendBy({
    type: `${type}_SUCCESS`,
    payload: data,
  }, { metadata })
)

const createErrorAction = ({ type, metadata }) => ex => (
  extendBy({
    type: `${type}_ERROR`,
    payload: ex,
  }, { metadata })
)

const takeLast = () => {

}

const dispatchPromise = (extendedAction: ExtendedAction, dispatch: Function) => {
  const {
    startAction,
    successAction,
    errorAction,
    initAction: {
      promise,
      promiseArg,
    },
  } = extendedAction

  dispatch(startAction)
  return promise(...(Array.isArray(promiseArg) ? promiseArg : [promiseArg]))
    .then((data) => {
      dispatch(successAction(data))
      return data
    }, (ex) => {
      dispatch(errorAction(ex))
      // TODO change to throw an error
      return ex
    })
}

const addPromiseToQueue = (extendedAction: ExtendedAction, dispatch: Function) => {
  const { initAction: { group } } = extendedAction
  let promiseInQueue
  const promise = new Promise((success, reject) => {
    promiseInQueue = { callback: () => dispatchPromise(extendedAction, dispatch), success, reject }
  })

  if (!(promisesInQueue[group] && promisesInQueue[group].length)) {
    promisesInQueue[group] = [promiseInQueue]
    runPromisesInQueue(group)
  } else {
    promisesInQueue[group].push(promiseInQueue)
  }

  return promise
}

const createExtendedAction = (action: Action): ExtendedAction => ({
  initAction: action,
  startAction: createStartAction(action),
  successAction: createSuccessAction(action),
  errorAction: createErrorAction(action),
})

const promiseBindMiddleware = (
  { dispatch } : { dispatch: Function },
) => (next: Function) => (action: Action) => {
  if (action && action.promise && typeof action.promise === 'function') {
    const extendedAction = createExtendedAction(action)

    switch (action.logic) {
      case 'inQueue':
        return addPromiseToQueue(extendedAction, dispatch)
      case 'takeLast':
        return takeLast(extendedAction, dispatch)
      default:
        return dispatchPromise(extendedAction, dispatch)
    }
  }
  return next(action)
}

export default promiseBindMiddleware
