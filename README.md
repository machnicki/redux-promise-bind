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

## License

MIT
