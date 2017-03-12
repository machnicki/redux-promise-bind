// @flow
const promiseBindMiddleware = (
  { dispatch } : { dispatch : Function },
) => (next: Function) => (action: Object) => {
  if (action && action.promise && typeof action.promise === 'function') {
    const { type, metadata, promise, promiseArg } = action

    dispatch({
      type: `${type}_START`,
      metadata,
    })

    return promise(...(Array.isArray(promiseArg) ? promiseArg : [promiseArg]))
      .then((data) => {
        dispatch({
          type: `${type}_SUCCESS`,
          payload: data,
          metadata,
        })

        return data
      }, (ex) => {
        dispatch({
          type: `${type}_ERROR`,
          payload: ex,
          metadata,
        })

        return ex
      })
  }
  return next(action)
}

export default promiseBindMiddleware
