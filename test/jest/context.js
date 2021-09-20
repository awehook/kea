/* global test, expect, beforeEach */
import { kea } from '../../src'
import './helper/jsdom'
import { corePlugin } from '../../src/core'
import { listenersPlugin } from '../../src/listeners'
import { activatePlugin } from '../../src/plugins'
import { getContext, openContext, closeContext, resetContext } from '../../src/context'

beforeEach(() => {
  closeContext()
})

test('getting and setting works', () => {
  expect(getContext()).not.toBeDefined()

  openContext({ createStore: false })

  expect(getContext()).toBeDefined()

  expect(getContext()).toMatchObject({
    plugins: {
      activated: [{ name: 'core' }, { name: 'listeners' }],
      // buildSteps: {},
      // logicFields: {},
      // events: {}
    },

    input: {
      logicPathCreators: new Map(),
      logicPathCounter: 0,
      defaults: undefined,
    },

    build: {
      cache: {},
    },

    mount: {
      counter: {},
      mounted: {},
    },

    reducers: {
      tree: {},
      roots: {},
      combined: undefined,
    },

    store: undefined,

    options: {
      debug: false,
      autoMount: false,
      proxyFields: true,
      flatDefaults: false,
      attachStrategy: 'dispatch',
      detachStrategy: 'dispatch',
    },
  })

  closeContext()

  expect(getContext()).not.toBeDefined()
})

test('context works with plugins', () => {
  expect(getContext()).not.toBeDefined()

  openContext()

  expect(getContext()).toBeDefined()

  const { plugins } = getContext()

  const testPlugin = {
    name: 'test',

    defaults: () => ({
      ranNewBuildStep: false,
    }),

    buildSteps: {
      newBuildStep(logic, input) {
        logic.ranNewBuildStep = true
      },
    },
  }

  expect(getContext()).toMatchObject({
    plugins: {
      activated: [{ name: 'core' }, { name: 'listeners' }],
    },
  })

  activatePlugin(testPlugin)

  expect(getContext()).toMatchObject({
    plugins: {
      activated: [{ name: 'core' }, { name: 'listeners' }, { name: 'test' }],
    },
  })

  expect(Object.keys(getContext().plugins.buildSteps)).toEqual([
    ...Object.keys(corePlugin.buildSteps),
    ...Object.keys(listenersPlugin.buildSteps),
    'newBuildStep',
  ])

  expect(getContext().plugins.buildSteps.connect).toEqual([corePlugin.buildSteps.connect])
  expect(getContext().plugins.buildSteps.newBuildStep).toEqual([testPlugin.buildSteps.newBuildStep])

  // const logic = kea({ options:{lazy:true}})
  const logic = kea({})
  logic.mount()

  expect(logic.ranNewBuildStep).toEqual(true)

  closeContext()
  expect(getContext()).not.toBeDefined()

  openContext({ plugins: [testPlugin] })

  expect(getContext()).toBeDefined()
  expect(getContext()).toMatchObject({
    plugins: {
      activated: [{ name: 'core' }, { name: 'listeners' }, { name: 'test' }],
    },
  })
})

test('logicPathCreators work as expected', () => {
  expect(getContext()).not.toBeDefined()

  openContext()
  expect(getContext()).toBeDefined()

  const {
    input: { logicPathCreators },
  } = getContext()

  const input = {
    path: () => ['kea', 'misc', 'blue'],
  }
  kea(input).build()
  expect(logicPathCreators.get(input)).not.toBeDefined()

  const dynamicInput = {
    key: (props) => props.id,
    path: (key) => ['kea', 'misc', 'green', key],
  }
  kea(dynamicInput).build({ id: 12 })
  expect(logicPathCreators.get(dynamicInput)).not.toBeDefined()

  const pathlessInput1 = {}
  kea(pathlessInput1).build()
  expect(logicPathCreators.get(pathlessInput1)().join('.')).toBe('kea.logic.1')

  const pathlessInput2 = {}
  kea(pathlessInput2).build()
  expect(logicPathCreators.get(pathlessInput2)().join('.')).toBe('kea.logic.2')

  const keyNoPathInput2 = { key: (props) => props.id }
  kea(keyNoPathInput2).build({ id: 12 })
  expect(logicPathCreators.get(keyNoPathInput2)(12).join('.')).toBe('kea.logic.3.12')
})

describe('defaultPath', () => {
  test('defaultPath work as expected', () => {
    openContext({
      defaultPath: ['kea', 'inline'],
    })

    kea({
      reducers: {
        hi: ['true', {}],
      },
    }).mount()

    expect(getContext().store.getState()).toEqual({
      kea: {
        inline: {
          1: {
            hi: 'true',
          },
        },
      },
    })
  })
})

test('nested context defaults work', () => {
  const { store } = resetContext({
    defaults: {
      scenes: { testy: { key: 'value', name: 'alfred', thisIs: 'missing' } },
    },
    createStore: true,
  })

  expect(store.getState()).toEqual({
    kea: {},
  })

  const logic = kea({
    path: () => ['scenes', 'testy'],
    reducers: () => ({
      key: ['noValue', {}],
      name: ['batman', {}],
    }),
  })

  expect(store.getState()).toEqual({
    kea: {},
  })

  logic.mount()

  expect(store.getState()).toEqual({
    kea: {},
    scenes: { testy: { key: 'value', name: 'alfred' } },
  })

  const logic2 = kea({
    path: () => ['scenes', 'noDefaults'],
    reducers: () => ({
      key: ['noValue', {}],
      name: ['batman', {}],
    }),
  })

  logic2.mount()

  expect(store.getState()).toEqual({
    kea: {},
    scenes: {
      testy: { key: 'value', name: 'alfred' },
      noDefaults: { key: 'noValue', name: 'batman' },
    },
  })
})

test('flat context defaults work', () => {
  const { store } = resetContext({
    defaults: {
      'scenes.testy': { key: 'value', name: 'alfred', thisIs: 'missing' },
    },
    flatDefaults: true,
    createStore: true,
  })

  expect(store.getState()).toEqual({
    kea: {},
  })

  const logic = kea({
    path: () => ['scenes', 'testy'],
    reducers: () => ({
      key: ['noValue', {}],
      name: ['batman', {}],
    }),
  })

  expect(store.getState()).toEqual({
    kea: {},
  })

  logic.mount()

  expect(store.getState()).toEqual({
    kea: {},
    scenes: { testy: { key: 'value', name: 'alfred' } },
  })

  const logic2 = kea({
    path: () => ['scenes', 'noDefaults'],
    reducers: () => ({
      key: ['noValue', {}],
      name: ['batman', {}],
    }),
  })

  logic2.mount()

  expect(store.getState()).toEqual({
    kea: {},
    scenes: {
      testy: { key: 'value', name: 'alfred' },
      noDefaults: { key: 'noValue', name: 'batman' },
    },
  })
})

test('unique context id each resetContext', async () => {
  resetContext({})
  const contextId1 = getContext().contextId
  resetContext({})
  const contextId2 = getContext().contextId
  resetContext({})
  const contextId3 = getContext().contextId
  expect(contextId1).not.toEqual(contextId2)
  expect(contextId2).not.toEqual(contextId3)
  expect(contextId1).not.toEqual(contextId3)
})
