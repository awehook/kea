/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from '../../src'

import './helper/jsdom'
import PropTypes from 'prop-types'

beforeEach(() => {
  resetContext()
})

test('can mount stores and have them connect to redux without react', () => {
  const { store } = getContext()

  const logic = kea({
    path: () => ['scenes', 'lazy'],
    actions: () => ({
      updateName: (name) => ({ name }),
    }),
    reducers: ({ actions }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name,
        },
      ],
    }),
    selectors: ({ constants, selectors }) => ({
      upperCaseName: [
        () => [selectors.capitalizedName],
        (capitalizedName) => {
          return capitalizedName.toUpperCase()
        },
        PropTypes.string,
      ],
      capitalizedName: [
        () => [selectors.name],
        (name) => {
          return name
            .trim()
            .split(' ')
            .map((k) => `${k.charAt(0).toUpperCase()}${k.slice(1).toLowerCase()}`)
            .join(' ')
        },
        PropTypes.string,
      ],
    }),
  })

  // nothing yet in the store
  expect(store.getState()).toEqual({ kea: {} })

  const unmount = logic.mount()

  expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'chirpy' } } })

  store.dispatch(logic.actionCreators.updateName('somename'))

  expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'somename' } } })

  unmount()

  // nothing in the store after unmounting
  expect(store.getState()).toEqual({ kea: {} })
})

test('can mount stores with keys and have them connet to redux without react', () => {
  const { store } = getContext()

  const logic = kea({
    key: (props) => props.id,
    path: (key) => ['scenes', 'lazy', key],
    actions: () => ({
      updateName: (name) => ({ name }),
    }),
    reducers: ({ actions }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name,
        },
      ],
    }),
    selectors: ({ constants, selectors }) => ({
      upperCaseName: [
        () => [selectors.capitalizedName],
        (capitalizedName) => {
          return capitalizedName.toUpperCase()
        },
        PropTypes.string,
      ],
      capitalizedName: [
        () => [selectors.name],
        (name) => {
          return name
            .trim()
            .split(' ')
            .map((k) => `${k.charAt(0).toUpperCase()}${k.slice(1).toLowerCase()}`)
            .join(' ')
        },
        PropTypes.string,
      ],
    }),
  })

  // nothing yet in the store
  expect(store.getState()).toEqual({ kea: {} })

  const unmount = logic({ id: 'testKey' }).mount()

  expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { testKey: { name: 'chirpy' } } } })

  store.dispatch(logic({ id: 'testKey' }).actionCreators.updateName('somename'))

  expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { testKey: { name: 'somename' } } } })

  unmount()

  // nothing in the store after unmounting
  expect(store.getState()).toEqual({ kea: {} })
})

test('can mount with callback', () => {
  const { store } = getContext()

  const logic = kea({
    path: () => ['scenes', 'lazy'],
    actions: () => ({
      updateName: (name) => ({ name }),
    }),
    reducers: ({ actions }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name,
        },
      ],
    }),
  })

  // nothing yet in the store
  expect(store.getState()).toEqual({ kea: {} })

  let callbackRan = false

  const response = logic.mount(() => {
    expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'chirpy' } } })

    logic.actions.updateName('somename')

    expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'somename' } } })

    callbackRan = true

    return 5
  })

  expect(callbackRan).toEqual(true)
  expect(response).toEqual(5)

  // nothing in the store after unmounting
  expect(store.getState()).toEqual({ kea: {} })
})

test('can mount with a promise', async () => {
  const { store } = getContext()

  const logic = kea({
    path: () => ['scenes', 'lazy'],
    actions: () => ({
      updateName: (name) => ({ name }),
    }),
    reducers: ({ actions }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name,
        },
      ],
    }),
  })

  // nothing yet in the store
  expect(store.getState()).toEqual({ kea: {} })

  let callbackRan = false

  const response = await logic.mount(() => {
    return new Promise((resolve, reject) => {
      expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'chirpy' } } })

      store.dispatch(logic.actionCreators.updateName('somename'))

      expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'somename' } } })

      callbackRan = true

      resolve(5)
    })
  })

  expect(callbackRan).toEqual(true)
  expect(response).toEqual(5)

  // nothing in the store after unmounting
  expect(store.getState()).toEqual({ kea: {} })
})

test('can mount with a async/await', async () => {
  const { store } = getContext()

  const logic = kea({
    path: () => ['scenes', 'lazy'],
    actions: () => ({
      updateName: (name) => ({ name }),
    }),
    reducers: ({ actions }) => ({
      name: [
        'chirpy',
        PropTypes.string,
        {
          [actions.updateName]: (state, payload) => payload.name,
        },
      ],
    }),
  })

  // nothing yet in the store
  expect(store.getState()).toEqual({ kea: {} })

  let callbackRan = false

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const response = await logic.mount(async () => {
    expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'chirpy' } } })

    logic.actions.updateName('somename')

    await delay(50)

    expect(store.getState()).toEqual({ kea: {}, scenes: { lazy: { name: 'somename' } } })

    callbackRan = true

    return 5
  })

  expect(callbackRan).toEqual(true)
  expect(response).toEqual(5)

  // nothing in the store after unmounting
  expect(store.getState()).toEqual({ kea: {} })
})

describe('can get mounted state with isMounted', () => {
  test('logicWrapper', async () => {
    const logic = kea({})
    expect(logic.isMounted()).toEqual(false)
    const u1 = logic.mount()
    expect(logic.isMounted()).toEqual(true)
    const u2 = logic.mount()
    expect(logic.isMounted()).toEqual(true)
    u1()
    expect(logic.isMounted()).toEqual(true)
    u2()
    expect(logic.isMounted()).toEqual(false)
    expect(() => u2()).toThrow()
    expect(logic.isMounted()).toEqual(false)
    logic.mount()
    expect(logic.isMounted()).toEqual(true)
  })

  test('isMounted/findMounted() on logicWrapper does not build', () => {
    const isLogicBuilt = () => typeof getContext().build.cache['kea.logic.1'] !== 'undefined'
    expect(isLogicBuilt()).toBeFalsy()
    const logic = kea({})
    expect(isLogicBuilt()).toBeFalsy()
    expect(logic.isMounted()).toEqual(false)
    expect(logic.findMounted()).toEqual(null)
    expect(isLogicBuilt()).toBeFalsy()
    const u1 = logic.mount()
    expect(isLogicBuilt()).toBeTruthy()
    expect(logic.isMounted()).toEqual(true)
    expect(logic.findMounted()).toEqual(logic())
    u1()
    expect(isLogicBuilt()).toBeFalsy()
  })

  test('isMounted/findMounted() on logicWrapper with a key and no props throws', () => {
    const logic = kea({ key: ({ id }) => id })
    expect(() => logic.isMounted()).toThrow()
  })

  test('isMounted/findMounted() on logicWrapper accepts props', () => {
    const logic = kea({ key: ({ id }) => id })
    expect(logic.isMounted({ id: 12 })).toEqual(false)
    expect(logic.findMounted({ id: 12 })).toEqual(null)

    logic({ id: 12 }).mount()
    expect(logic.isMounted({ id: 12 })).toEqual(true)
    expect(logic.findMounted({ id: 12 })).toEqual(logic({ id: 12 }))
  })

  test('buildLogic', async () => {
    const logic = kea({}).build()
    expect(logic.isMounted()).toEqual(false)
    const u1 = logic.mount()
    expect(logic.isMounted()).toEqual(true)
    const u2 = logic.mount()
    expect(logic.isMounted()).toEqual(true)
    u1()
    expect(logic.isMounted()).toEqual(true)
    u2()
    expect(logic.isMounted()).toEqual(false)
    expect(() => u2()).toThrow()
    expect(logic.isMounted()).toEqual(false)
    logic.mount()
    expect(logic.isMounted()).toEqual(true)
  })
})
