// @flow
const promiseBindMiddleware = (
  { dispatch } : { dispatch : Function },
) => (next: Function) => (action: Object) => {
  if (action && action.promise && typeof action.promise === 'function') {
    const { type, metadata } = action

    dispatch({
      type: `${type}_START`,
      metadata,
    })

    return action.promise().then((data) => {
      dispatch({
        type: `${type}_SUCCESS`,
        data,
        metadata,
      })

      return data
    }, (data) => {
      dispatch({
        type: `${type}_ERROR`,
        data,
        metadata,
      })

      return data
    })
  }
  return next(action)
}

export default promiseBindMiddleware
