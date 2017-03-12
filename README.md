Redux Promise Bind
=============
Promise Bind [middleware](http://redux.js.org/docs/advanced/Middleware.html) for Redux.

```node
npm install --save redux-promise-bind
```

## Motivation
Redux Promise Bind middleware gives you more control over promises. Writing logic based on promises should be faster than using [Redux Thunk](https://github.com/gaearon/redux-thunk) or [Redux Promise](https://github.com/acdlite/redux-promise).

You dispatch object (that's why it is easy to test), and Redux middleware will trigger promise and dispatch appropriate actions (with `_START`, `_SUCCESS` or `_ERROR` action type suffixes) for you.
So you don't need to make it manually (for example in thunk).

```js
dispatch({
  type: 'GET',
  promise: axios.get.bind(null, ...attr)
})
```

Your action creator could be
```js
function addItem(...attr) {
  return {
    type: 'ADD',
    promise: http.post.bind(null, '//url.com', ...attr)
  }
}
```
and Redux Promise Bind middleware will dispatch `ADD_START` action (you could for example
show spinner) and after resolve promise will dispatch `ADD_SUCCESS` (or `ADD_ERROR`) with
response data as a payload, so you could manage it by reducer.

Because promises are triggered by middleware, you have more control. You can keep your promises
in queue or abort previous or next promises from the same group. You could also create your
custom middleware to add more logic around.

## Installation

```node
npm install --save redux-promise-bind
```

To add Redux Promise Bind, use [applyMiddleware](http://redux.js.org/docs/api/applyMiddleware.html)
(similar like others middlewares).

```js
import { createStore, applyMiddleware } from 'redux'
import promiseBind from 'redux-promise-bind'
import rootReducer from './reducers/index'

// Note: this API requires redux@>=3.1.0
const store = createStore(
  rootReducer,
  applyMiddleware(promiseBind),
)
```

## Usage
To handle action by Redux Promise Bind you need to dispatch action with `promise`
attribute in body. It could for example ajax client.

### Passing attributes to promise
You can bind attributes directly to your function
```js
function actionCreator() {
  return {
    type: 'ACTION_TYPE',
    promise: yourFunction.bind(null, 'arg1', 'arg2')
  }
}
```
or you can pass them in promiseArg attribute
```js
function actionCreator() {
  return {
    type: 'ACTION_TYPE',
    promise: yourFunction,
    promiseArg: ['arg1', 'arg2'],
  }
}
```

### Access to response data in container
Because Redux Promise Bind Middleware returns promises and responses, you could have access
to them in your container or in another middleware.

```js
this.props.dispatch(
  myActionCreator(arg1)
).then((promiseResponse) => console.log(`data from promise ${promiseResponse}`))
```

### Metadata and responses
Redux Promise Bind Middleware will dispatch actions with `_START`, `_SUCCESS` or `_ERROR` action types for
you. Success promises response or error response will be kept in `payload` action parameter.

You can pass some metadata in `metadata` action parameter if you want to keep it in each generic action.

For example, you can dispatch action
```js
{
  type: 'SAVE',
  promise: model.save,
  promiseArg: '123',
  metadata: { id: '123' },
}
```
`model.save` is function, which create HTTP request to save our data.

Redux Promise Bind Middleware immediately will dispatch action
```js
{
  type: 'SAVE_START',
  metadata: { id: '123' },
}
```
so you can show spinner or show appropriate message. Metadata in this case could be helpful
if you would like to have Redux store with states (`isLoading`, `hasError`) associated to ID.

After successful promise resolving (let's assume that `model.save` has returned `success` string)
Redux Promise Bind Middleware immediately will dispatch action
```js
{
  type: 'SAVE_SUCCESS',
  payload: 'success',
  metadata: { id: '123' },
}
```

If promise will throw an error (let's assume that `model.save` has returned `error` string)
Redux Promise Bind Middleware immediately will dispatch action
```js
{
  type: 'SAVE_ERROR',
  payload: 'error',
  metadata: { id: '123' },
}
```

For both responses you could for example change your Redux state and hide spinner for specific ID.

## Group promises (TODO promise queue, takeLast, takeFirst)

## License
MIT
