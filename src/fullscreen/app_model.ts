import {Model} from "./types";
import {Change, observeObject, Observer} from "../helpers/observe_helpers";
import {SceneGraph} from "./scene";
import * as Immutable from "immutable";

export interface AppModelListener {
  onAppModelChange(change: Change<Model.App>): void
}

export class Selection {
  private model: Model.App

  constructor(model: Model.App) {
    this.model = model
  }

  has(guid: string): boolean {
    return this.model.selection.has(guid)
  }

  clobber(guid: string): void {
    this.model.selection = this.model.selection.clear().add(guid)
  }

  clear(): void {
    this.model.selection = this.model.selection.clear()
  }

  delete(guid: string): void {
    this.model.selection = this.model.selection.delete(guid)
  }

  add(guid: string, scene: SceneGraph): void {
    const ancestorGUIDs = this.selectedAncestors(guid, scene)
    const childrenGUIDs = this.selectedChildren(guid, scene)

    let newSelection = this.model.selection

    for (const a of ancestorGUIDs) {
      newSelection = newSelection.delete(a)
    }
    for (const c of childrenGUIDs) {
      newSelection = newSelection.delete(c)
    }

    this.model.selection = newSelection.add(guid)
  }

  guids(): Immutable.Set<string> {
    return this.model.selection
  }

  selectedAncestors(guid: string, scene: SceneGraph): Set<string> {
    const result = new Set<string>()

    for (const selectedGUID of this) {
      const selected = scene.getNode(selectedGUID)
      if (selected && selected.hasDescendant(guid)) {
        result.add(selectedGUID)
      }
    }

    return result
  }

  selectedChildren(guid: string, scene: SceneGraph): Set<string> {
    const result = new Set<string>()

    const node = scene.getNode(guid)
    if (node == null) {
      return result
    }

    for (const selectedGUID of this) {
      if (node.hasDescendant(selectedGUID)) {
        result.add(selectedGUID)
      }
    }
    return result
  }

  [Symbol.iterator]() {
    return this.model.selection[Symbol.iterator]()
  }
}

export class AppModel {
  private readonly model: Model.App
  private listener: AppModelListener

  // Helper objects for AppModel internals
  private readonly selectionHelper: Selection

  constructor(model: Readonly<Model.App>) {
    const observer = new Observer<Model.App>()

    this.model = observeObject<Model.App>(model, observer)
    this.selectionHelper = new Selection(this.model)

    observer.addListener((c: Change<Model.App>) => {
      if (c.type == 'SET') {
        this.listener.onAppModelChange(c)
      }
    })
  }

  setAppModelListener(l: AppModelListener) {
    this.listener = l
  }

  get selection(): Selection {
    return this.selectionHelper
  }

  set<K extends keyof Model.App>(key: K, value: Model.App[K]) {
    if (key === 'selection') {
      throw new Error('you should set selection via the Selection class')
    }
    this.model[key] = value
  }

  setWith<K extends keyof Model.App>(key: K, f: (v: Model.App[K]) => Model.App[K]) {
    this.model[key] = f(this.model[key])
  }

  get<K extends keyof Model.App>(key: K): Model.App[K] {
    return this.model[key]
  }

  getModel(): Readonly<Model.App> {
    return this.model
  }
}