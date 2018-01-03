import {AppModelObserver} from "./editor";
import {Change} from "../helpers/observe_helpers";
import {Model} from "./types";
import {SceneGraph} from "./scene";

export class SelectionEnforcer implements AppModelObserver {
  scene: Readonly<SceneGraph>
  lock: boolean

  constructor(scene: Readonly<SceneGraph>) {
    this.scene = scene
  }

  computeInvalidSelections(app: Model.App): Set<string> {
    const toDelete = new Set<string>()

    for (const guid of app.selection) {
      if (toDelete.has(guid)) {
        continue
      }

      const node = this.scene.getNode(guid)
      if (node == null) {
        toDelete.add(guid)
        continue
      }

      const descendants = node.descendants()
      for (const guid of app.selection) {
        if (descendants.has(guid)) {
          toDelete.add(guid)
          continue
        }
      }
    }

    return toDelete
  }

  onAppModelChange(change: Change<Model.App>): void {
    if (change.key !== 'selection') {
      return
    }

    const app = change.object

    if (this.lock) return
    this.lock = true

    const toDelete = this.computeInvalidSelections(app)
    if (toDelete.size > 0) {
      app.selection = app.selection.subtract(Array.from(toDelete))
    }

    this.lock = false
  }
}
