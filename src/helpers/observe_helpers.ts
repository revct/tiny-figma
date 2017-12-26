
export type ChangeType = 'DELETE' | 'SET'

export interface Change {
  key: PropertyKey
  oldValue: any
  newValue?: any
  type: 'DELETE' | 'SET'
}

export type ChangeListener = (change: Change) => void

export class Observer {
  changeListeners: Set<ChangeListener>

  constructor() {
    this.changeListeners = new Set()
  }

  addListener(l: ChangeListener) {
    this.changeListeners.add(l)
  }

  removeListener(l: ChangeListener) {
    this.changeListeners.delete(l)
  }

  notifyChange(c: Change) {
    for (const l of this.changeListeners) {
      l(c)
    }
  }
}

export const observeObject = <T> (object: T & object): [T, Observer] => {
  const observer = new Observer()
  const proxy = new Proxy(object, {
    set(target, key, newValue, receiver) {
      const oldValue = object[key]
      object[key] = newValue

      observer.notifyChange({key, oldValue, newValue, type: 'SET'})
      return true
    },
    deleteProperty(target, key) {
      const oldValue = object[key]
      delete object[key]

      observer.notifyChange({key, oldValue, type: 'DELETE'})
      return true
    }
  });

  return [proxy as T, observer]
}
