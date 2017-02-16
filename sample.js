function fetchSomething(...params) {
  return {
    type: 'FETCH_SOMETHING',
    promise: Something.fetch.bind(null, ...params),
  }
}

//will get FETCH_SOMETHING_START, FETCH_SOMETHING_SUCCESS, FETCH_SOMETHING_FAILED
// what do with data, how to convert etc -> reducer, reducer will get server response
// eg. show spinner etc for *_START, etc...


// function fetchSomethingWithCallbacks(...params) {
//   return {
//     type: 'FETCH_SOMETHING',
//     promise: Something.fetch.bind(null, ...params),
//     onSuccess: data => data.map(() => {}),
//     onError: () => {},
//   }
// }

// function fetchSomethingInQueue(...params) {
//   return {
//     type: 'FETCH_SOMETHING',
//     promise: Something.fetch.bind(null, ...params),
//     queue: 'UUID123',
//   }
// }
