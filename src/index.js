// @flow

const extendBy = (object: Object, { metadata } : { metadata : any }) => {
  if (metadata) return { ...object, metadata }
  return object
}

const promiseBindMiddleware = (
  { dispatch } : { dispatch : Function },
) => (next: Function) => (action: Object) => {
  if (action && action.promise && typeof action.promise === 'function') {
    const { type, metadata, promise, promiseArg } = action

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
  return next(action)
}

export default promiseBindMiddleware
