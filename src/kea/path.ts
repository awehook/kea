import { getContext } from '../context'
import { Input, PathCreator, Props } from '../types'

export function getPathForInput(input: Input, props: Props) {
  const key = props && input.key ? input.key(props) : undefined

  if (input.path) {
    return input.path(key)
  }

  const {
    input: { inlinePathCreators },
  } = getContext()

  let pathCreator = inlinePathCreators.get(input)

  if (pathCreator) {
    return pathCreator(key)
  }

  const count = (++getContext().input.inlinePathCounter).toString()

  if (input.key) {
    pathCreator = ((key: string) => ['kea', 'inline', count, key]) as PathCreator
  } else {
    pathCreator = () => ['kea', 'inline', count]
  }

  inlinePathCreators.set(input, pathCreator)

  return pathCreator(key)
}

export function getPathStringForInput(input: Input, props: Props) {
  return getPathForInput(input, props).join('.')
}
