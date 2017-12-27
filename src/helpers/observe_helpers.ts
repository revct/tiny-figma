
export type ChangeType = 'DELETE' | 'SET'

export interface Change<T> {
  object: T
  key: keyof T
  oldValue: any
  newValue?: any
  type: 'DELETE' | 'SET'
}

export type ChangeListener<T> = (change: Change<T>) => void

export class Observer<T> {
  changeListeners: Set<ChangeListener<T>>

  constructor() {
    this.changeListeners = new Set()
  }

  addListener(l: ChangeListener<T>) {
    this.changeListeners.add(l)
  }

  removeListener(l: ChangeListener<T>) {
    this.changeListeners.delete(l)
  }

  notifyChange(c: Change<T>) {
    for (const l of this.changeListeners) {
      l(c)
    }
  }
}

export const observeObject = <T> (object: T & object, observer: Observer<T>): T => {
  const proxy = new Proxy(object, {
    set(target, key: keyof T, newValue, receiver) {
      const oldValue = object[key]
      object[key] = newValue

      observer.notifyChange({object, key, oldValue, newValue, type: 'SET'})
      return true
    },
    deleteProperty(target, key: keyof T) {
      const oldValue = object[key]
      delete object[key]

      observer.notifyChange({object, key, oldValue, type: 'DELETE'})
      return true
    }
  });

  return proxy as T
}
