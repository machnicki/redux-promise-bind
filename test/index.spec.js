import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import promiseBindMiddleware from '../src/index'

chai.use(sinonChai)

describe('#Redux Promise Bind Middleware', () => {
  let promisesMocksQueue = []

  const mocks = {}
  mocks.doNext = () => null
  mocks.doDispatch = () => mocks.doNext
  mocks.promise = () => ({
    then: (success, error) => {
      let successCallback = () => null
      let errorCallback = () => null

      promisesMocksQueue.push({
        success: (...attr) => {
          successCallback(success(...attr))
        },
        error: (...attr) => {
          errorCallback(error(...attr))
        },
      })

      return { then: (cb, ex) => { successCallback = cb; errorCallback = ex } }
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
    promisesMocksQueue = []
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

    promisesMocksQueue[0].success({ data: 'test' })

    expect(dispatchSpy).to.have.been.calledTwice
    expect(dispatchSpy.secondCall).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      metadata: { foo: 'bar' },
      payload: { data: 'test' },
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

    promisesMocksQueue[0].error({ data: 'test' })

    expect(dispatchSpy).to.have.been.calledTwice
    expect(dispatchSpy.secondCall).to.have.been.calledWith({
      type: 'MY_ACTION_ERROR',
      metadata: { foo: 'bar' },
      payload: { data: 'test' },
    })
  })

  it('should chain promises after success', (done) => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
    }).then((...data) => {
      thenSpy(...data)
      expect(thenSpy).to.have.been.calledOnce
      expect(thenSpy).to.have.been.calledWith({ data: 'test' })
      done()
    })

    promisesMocksQueue[0].success({ data: 'test' })
  })

  it('should chain promises after failure', (done) => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
    }).then(null, (...data) => {
      thenSpy(...data)
      expect(thenSpy).to.have.been.calledOnce
      expect(thenSpy).to.have.been.calledWith('error!')
      done()
    })

    promisesMocksQueue[0].error('error!')
  })

  it('should trigger promises in predefined queue', (done) => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION1',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'inQueue',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION2',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'inQueue',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION3',
      promise: mocks.promise,
      group: 'myAnotherGroup',
      logic: 'inQueue',
    }).then((...data) => {
      thenSpy(...data)
      expect(thenSpy).to.have.been.calledTwice
      expect(thenSpy.getCall(0)).to.have.been.calledWith('my-first-response')
      expect(thenSpy.getCall(1)).to.have.been.calledWith('my-second-response')
      done()
    })

    expect(dispatchSpy.callCount).to.equal(2)
    expect(dispatchSpy.getCall(0)).to.have.been.calledWith({
      type: 'MY_ACTION1_START',
    })
    expect(dispatchSpy.getCall(1)).to.have.been.calledWith({
      type: 'MY_ACTION3_START',
    })
    promisesMocksQueue[0].success('my-first-response')
    promisesMocksQueue[1].success('my-second-response')
    expect(dispatchSpy.callCount).to.equal(5)
    expect(dispatchSpy.getCall(2)).to.have.been.calledWith({
      type: 'MY_ACTION1_SUCCESS',
      payload: 'my-first-response',
    })
    expect(dispatchSpy.getCall(3)).to.have.been.calledWith({
      type: 'MY_ACTION2_START',
    })
    expect(dispatchSpy.getCall(4)).to.have.been.calledWith({
      type: 'MY_ACTION3_SUCCESS',
      payload: 'my-second-response',
    })
  })

  xit('should abort previous promises', () => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'takeLast', // TODO mention that type should be the same as well
      metadata: 'first-action',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myAnotherGroup',
      logic: 'takeLast',
      metadata: 'second-action',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'takeLast',
      metadata: 'second-action',
    }).then(thenSpy)

    expect(dispatchSpy.callCount).to.equal(3)
    expect(dispatchSpy.getCall(0)).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: 'first-action',
    })
    expect(dispatchSpy.getCall(1)).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: 'second-action',
    })
    expect(dispatchSpy.getCall(2)).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: 'third-action',
    })
    promisesMocksQueue[0].success('my-first-response')
    promisesMocksQueue[1].success('my-second-response')
    promisesMocksQueue[2].success('my-third-response')
    expect(dispatchSpy.callCount).to.equal(5)
    expect(dispatchSpy.getCall(3)).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      payload: 'my-second-response',
      metadata: 'second-action',
    })
    expect(dispatchSpy.getCall(4)).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      payload: 'my-third-response',
      metadata: 'thirdaction',
    })

    expect(thenSpy).to.have.been.calledThrice
    expect(thenSpy.getCall(0)).to.have.been.calledWith('my-second-response')
    expect(thenSpy.getCall(1)).to.have.been.calledWith('my-third-response')
    expect(thenSpy.getCall(2)).to.have.been.calledWith('my-third-response')
  })

  xit('should abort next promises', () => {
    const thenSpy = sinon.spy()

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'takeFirst',
      metadata: 'first-action',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myAnotherGroup',
      logic: 'takeFirst',
      metadata: 'second-action',
    }).then(thenSpy)

    dispatchAction({
      type: 'MY_ACTION',
      promise: mocks.promise,
      group: 'myGroup',
      logic: 'takeFirst',
      metadata: 'third-action',
    }).then(thenSpy)

    expect(dispatchSpy.callCount).to.equal(2)
    expect(dispatchSpy.getCall(0)).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: 'first-action',
    })
    expect(dispatchSpy.getCall(1)).to.have.been.calledWith({
      type: 'MY_ACTION_START',
      metadata: 'second-action',
    })
    promisesMocksQueue[0].success('my-first-response')
    promisesMocksQueue[1].success('my-second-response')
    promisesMocksQueue[2].success('my-third-response')
    expect(dispatchSpy.callCount).to.equal(4)
    expect(dispatchSpy.getCall(2)).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      payload: 'my-first-response',
      metadata: 'first-action',
    })
    expect(dispatchSpy.getCall(3)).to.have.been.calledWith({
      type: 'MY_ACTION_SUCCESS',
      payload: 'my-second-response',
      metadata: 'second-action',
    })

    expect(thenSpy).to.have.been.calledThrice
    expect(thenSpy.getCall(0)).to.have.been.calledWith('my-first-response')
    expect(thenSpy.getCall(1)).to.have.been.calledWith('my-first-response')
    expect(thenSpy.getCall(2)).to.have.been.calledWith('my-second-response')
  })
})
