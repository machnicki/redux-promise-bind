import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import compose from 'lodash/fp/compose'
import map from 'lodash/fp/map'

import promiseBindMiddleware from '../src/index'

chai.use(sinonChai)

describe('#Redux Promise Bind Middleware', () => {
  const mocks = {}
  mocks.doNext = () => null
  mocks.doDispatch = () => mocks.doNext
  const nextSpy = sinon.spy(mocks, 'doNext')
  const dispatchSpy = sinon.spy(mocks, 'doDispatch')

  const dispatchAction = promiseBindMiddleware({ dispatch: mocks.doDispatch })(mocks.doNext)

  const samplePromise = () => null

  beforeEach(() => {
    nextSpy.reset()
    dispatchSpy.reset()
  })

  it('should trigger next middleware if promise doesn\'t exist', () => {
    dispatchAction({
      type: 'MY_ACTION',
    })

    expect(nextSpy).to.have.been.calledOnce
    expect(nextSpy).to.have.been.calledWith({
      type: 'MY_ACTION',
    })
  })

  xit('should trigger promise function', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION',
      promise: samplePromise.bind(null, 'myParam'),
    })
  })

  xit('should dispatch proper actions on success', () => {
    // expect MY_ACTION_START with metadata
    // expect MY_ACTION_SUCCESS with metadata
  })

  xit('should dispatch proper actions on error', () => {
    // expect MY_ACTION_START with metadata
    // expect MY_ACTION_ERROR with metadata
  })

  xit('should chain promises', () => {
    // .then() after dispatch
  })

  xit('should trigger promises in predefined queue', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: samplePromise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'inQueue',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: samplePromise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'inQueue',
    })
  })

  xit('should abort previous promises', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: samplePromise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'takeLast',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: samplePromise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'takeLast',
    })
  })

  xit('should abort next promises', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: samplePromise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'takeFirst',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: samplePromise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'takeFirst',
    })
  })

  xit('should add mapping', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION',
      promise: compose(map(data => data.results), samplePromise.bind(null, 'myParam')),
    })
  })
})
