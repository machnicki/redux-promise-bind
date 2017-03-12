import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import compose from 'lodash/fp/compose'
import map from 'lodash/fp/map'

import promiseBindMiddleware from '../src/index'

chai.use(sinonChai)

describe('#Redux Promise Bind Middleware', () => {
  let promiseMockSuccess
  let promiseMockError

  const mocks = {}
  mocks.doNext = () => null
  mocks.doDispatch = () => mocks.doNext
  mocks.promise = () => ({
    then: (success, error) => {
      let successCallback = () => null
      let errorCallback = () => null

      promiseMockSuccess = (...attr) => {
        successCallback(success(...attr))
      }
      promiseMockError = (...attr) => {
        errorCallback(error(...attr))
      }

      return { then: (cb, ex) => { successCallback = cb, errorCallback = ex } }
    },
  })

  const nextSpy = sinon.spy(mocks, 'doNext')
  const dispatchSpy = sinon.spy(mocks, 'doDispatch')
  const promiseSpy = sinon.spy(mocks, 'promise')

  const dispatchAction = promiseBindMiddleware({ dispatch: mocks.doDispatch })(mocks.doNext)

  beforeEach(() => {
    nextSpy.reset()
    dispatchSpy.reset()
    promiseSpy.reset()
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

  it('should trigger promise function', () => {
    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      promiseArg: ['test1', 'test2'],
    })

    expect(promiseSpy).to.have.been.calledOnce
    expect(promiseSpy).to.have.been.calledWith('test1', 'test2')
  })

  it('should trigger promise function with bind', () => {
    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise.bind(null, 'test3', 'test4'),
    })

    expect(promiseSpy).to.have.been.calledOnce
    expect(promiseSpy).to.have.been.calledWith('test3', 'test4')
  })

  it('should dispatch proper actions on success', () => {
    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      metadata: { foo: 'bar' },
    })

    expect(dispatchSpy).to.have.been.calledOnce
    expect(dispatchSpy).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: { foo: 'bar' },
    })

    promiseMockSuccess({ data: 'test' })

    expect(dispatchSpy).to.have.been.calledTwice
    expect(dispatchSpy.secondCall).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      metadata: { foo: 'bar' },
      data: { data: 'test' },
    })
  })

  it('should dispatch proper actions on error', () => {
    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      metadata: { foo: 'bar' },
    })

    expect(dispatchSpy).to.have.been.calledOnce
    expect(dispatchSpy).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: { foo: 'bar' },
    })

    promiseMockError({ data: 'test' })

    expect(dispatchSpy).to.have.been.calledTwice
    expect(dispatchSpy.secondCall).to.have.been.calledWith({
      type: 'MY_ACTION_ERROR',
      metadata: { foo: 'bar' },
      data: { data: 'test' },
    })
  })

  it('should chain promises after success', () => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
    }).then(thenSpy)

    promiseMockSuccess({ data: 'test' })

    expect(thenSpy).to.have.been.calledOnce
    expect(thenSpy).to.have.been.calledWith({ data: 'test' })
  })

  it('should chain promises after failure', () => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
    }).then(null, thenSpy)

    promiseMockError('error!')

    expect(thenSpy).to.have.been.calledOnce
    expect(thenSpy).to.have.been.calledWith('error!')
  })

  xit('should trigger promises in predefined queue', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: mocks.promise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'inQueue',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: mocks.promise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'inQueue',
    })
  })

  xit('should abort previous promises', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: mocks.promise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'takeLast',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: mocks.promise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'takeLast',
    })
  })

  xit('should abort next promises', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION1',
      promise: mocks.promise.bind(null, 'myParam1'),
      group: 'myGroup',
      logic: 'takeFirst',
    })

    promiseBindMiddleware({
      type: 'MY_ACTION2',
      promise: mocks.promise.bind(null, 'myParam2'),
      group: 'myGroup',
      logic: 'takeFirst',
    })
  })

  xit('should add mapping', () => {
    promiseBindMiddleware({
      type: 'MY_ACTION',
      promise: compose(map(data => data.results), mocks.promise.bind(null, 'myParam')),
    })
  })
})
