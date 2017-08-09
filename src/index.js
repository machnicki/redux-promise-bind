import _get from 'lodash/get'
// @flow

const extendBy = (object: Object, { metadata } : { metadata : any }) => {
  if (metadata) return { ...object, metadata }
  return object
}

const promisesInQueue = {}
const takeFirstActions = new Map()
const takeLastActions = new Map()

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
  promise: any,
  promiseSuccess: any,
  promiseReject: any,
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

const dispatchPromise = (
  extendedAction: ExtendedAction,
  dispatch: Function,
  onSuccess?: Function,
  onError?: Function,
) => {
  const {
    startAction,
    successAction,
    errorAction,
    initAction: {
      promise: originalPromise,
      promiseArg,
    },
    promise,
    promiseSuccess,
    promiseReject,
  } = extendedAction

  dispatch(startAction)
  originalPromise(...(Array.isArray(promiseArg) ? promiseArg : [promiseArg]))
    .then((data) => {
      if (typeof onSuccess === 'function') return onSuccess(data)
      dispatch(successAction(data))
      return promiseSuccess(data)
    }, (ex) => {
      dispatch(errorAction(ex))
      if (typeof onError === 'function') onError(ex)
      // TODO change to throw an error
      return promiseReject(ex)
    })

  return promise
}

const addToGroup = (extendedAction: ExtendedAction, actionsList: Object) => {
  const { initAction: { group } } = extendedAction
  if (!actionsList.has(group)) actionsList.set(group, [])
  actionsList.get(group).push(extendedAction)
}

// TODO this logic should be to go first ;)
const takeLast = (extendedAction: ExtendedAction, dispatch: Function) => {
  const { initAction: { group }, successAction, errorAction } = extendedAction

  addToGroup(extendedAction, takeLastActions)

  dispatchPromise(extendedAction, dispatch, (data) => {

  })
}

const takeFirst = (extendedAction: ExtendedAction, dispatch: Function) => {
  const { initAction: { group }, successAction, errorAction } = extendedAction

  addToGroup(extendedAction, takeFirstActions)

  if (_get(takeFirstActions.get(group), 'length') === 1) {
    dispatchPromise(extendedAction, dispatch, (data) => {
      takeFirstActions.get(group).slice(1).forEach(({ successAction, errorAction }) => {
        dispatch(successAction(data))
        return data
      })

      takeFirstActions.delete(group)
    }, (err) => {
      takeFirstActions.get(group).slice(1).forEach(({ successAction, errorAction }) => {
        dispatch(errorAction(err))
        return err
      })

      takeFirstActions.delete(group)
    })
  }
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

const createExtendedAction = (action: Action): ExtendedAction => {
  let promiseSuccess, promiseReject

  const promise = new Promise((success, reject) => {
    promiseSuccess = success
    promiseReject = reject
  })

  return {
    initAction: action,
    startAction: createStartAction(action),
    successAction: createSuccessAction(action),
    errorAction: createErrorAction(action),
    promise,
    promiseSuccess,
    promiseReject,
  }
}

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
      case 'takeFirst':
        return takeFirst(extendedAction, dispatch)
      default:
        return dispatchPromise(extendedAction, dispatch)
    }
  }
  return next(action)
}

export default promiseBindMiddleware
