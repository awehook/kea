import { BuiltLogic, LogicWrapper } from './types'

export function isLogicWrapper(logic: any): logic is LogicWrapper {
  return !!logic?._isKea
}

export function isBuiltLogic(logic: any): logic is BuiltLogic {
  return !!logic?._isKeaBuild
}

export function log(...args: any[]) {
  if(typeof localStorage !== "undefined") {
    if(localStorage.getItem('keaLog') !== '0')
      console.log(...args)
  }
}
