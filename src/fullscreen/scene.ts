import {Model} from "./types";
import {Change, observeObject, Observer} from "../helpers/observe_helpers";

export interface SceneGraphListener {
  onNodeAdded: (guid: string) => void
  onNodeRemoved: (guid: string) => void
  onNodeChanged: (guid: string, change: Change<Model.Node>) => void
}

export class SceneGraph {
  private scene: Model.Scene
  private sceneObserver: Observer<Model.Scene> = new Observer()
  private nodesObserver: Observer<Model.Node> = new Observer()

  private listeners: Set<SceneGraphListener> = new Set()

  constructor(scene: Model.Scene) {
    this.scene = observeObject<Model.Scene>({}, this.sceneObserver)
    for (const key in scene) {
      this.addNode(scene[key])
    }

    this.sceneObserver.addListener((c: Change<Model.Scene>) => {
      if (c.type == 'DELETE') {
        this.notifyNodeRemoved(c.key as string)
      }
      if (c.type == 'SET' && c.oldValue != null) {
        this.notifyNodeAdded(c.key as string)
      }
    })
    this.nodesObserver.addListener((c: Change<Model.Node>) => {
      if (c.type == 'DELETE') {
        this.notifyNodeChanged(c.object.guid, c)
      }
      if (c.type == 'SET' && c.oldValue != null) {
        this.notifyNodeChanged(c.object.guid, c)
      }
    })
  }

  addSceneGraphListener(l: SceneGraphListener) {
    this.listeners.add(l)
  }

  private notifyNodeAdded(guid: string) {
    for (const l of this.listeners) {
      l.onNodeAdded(guid)
    }
  }

  private notifyNodeRemoved(guid: string) {
    for (const l of this.listeners) {
      l.onNodeRemoved(guid)
    }
  }

  private notifyNodeChanged(guid: string, change: Change<Model.Node>) {
    for (const l of this.listeners) {
      l.onNodeChanged(guid, change)
    }
  }

  addNode(node: Model.Node) {
    this.scene[node.guid] = observeObject<Model.Node>(node, this.nodesObserver)
  }

  object(): Readonly<Model.Scene> {
    return this.scene
  }
}