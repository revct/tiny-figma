import {Model} from "./types";
import {Change, observeObject, Observer} from "../helpers/observe_helpers";
import {mat2d, vec2} from "gl-matrix";
import {generateGUID} from "./editor";
import isParentableNode = Model.isParentableNode;
import {Drawable} from "./graphics";
import set = Reflect.set;
import FrameNode = Model.FrameNode;

export interface SceneGraphListener {
  onNodeAdded: (guid: string) => void
  onNodeRemoved: (guid: string) => void
  onNodeChanged: (guid: string, change: Change<Model.Node>) => void
}

export class SceneNode<TNode extends Model.Node> {
  private data: TNode
  private derived: DerivedNodeProperties
  private scene: SceneGraph

  constructor(data: TNode, derived: DerivedNodeProperties, scene: SceneGraph) {
    this.data = data
    this.derived = derived
    this.scene = scene
  }

  children(): ReadonlySet<string> {
    return this.derived.children
  }

  isFrame(): this is SceneNode<FrameNode> {
    return Model.isFrame(this.data)
  }

  set<K extends keyof TNode>(key: K, value: TNode[K]) {
    this.data[key] = value
  }

  get<K extends keyof TNode>(key: K): TNode[K] {
    return this.data[key]
  }

  render(): Drawable[] {
    if (Model.isFrame(this.data)) {
      const topLeftCorner: vec2 = vec2.fromValues(0, 0)
      const bottomRightCorner: vec2 = vec2.fromValues(this.data.width, this.data.height)

      // This code does not handle rotation!
      vec2.transformMat2d(topLeftCorner, topLeftCorner, this.derived.absoluteTransform)
      vec2.transformMat2d(bottomRightCorner, bottomRightCorner, this.derived.absoluteTransform)

      return [{
        type: 'RECTANGLE',
        color: this.data.color,
        topLeftCorner,
        bottomRightCorner
      }]
    }

    return []
  }
}

interface DerivedNodeProperties {
  children: Set<string>
  absoluteTransform: mat2d
}

export class SceneGraph {
  private scene: Model.Scene
  private derivedScene: {[guid: string]: DerivedNodeProperties}

  private sceneObserver: Observer<Model.Scene> = new Observer()
  private nodesObserver: Observer<Model.Node> = new Observer()

  private listeners: Set<SceneGraphListener> = new Set()

  constructor(scene: Model.Scene) {
    this.scene = observeObject<Model.Scene>({}, this.sceneObserver)
    this.derivedScene = {}

    this.sceneObserver.addListener((c: Change<Model.Scene>) => {
      if (c.type == 'DELETE') {
        this.onNodeRemoved(c.key as string, c.oldValue)
      }
      if (c.type == 'SET') {
        if (c.oldValue != null) {
          console.error(`received a node re-assignment ${JSON.stringify(c)}`)
        }
        this.onNodeAdded(c.key as string)
      }
    })
    this.nodesObserver.addListener((c: Change<Model.Node>) => {
      if (c.type == 'DELETE') {
        this.onNodeChanged(c.object.guid, c)
      }
      if (c.type == 'SET' && c.oldValue != null) {
        this.onNodeChanged(c.object.guid, c)
      }
    })

    for (const key in scene) {
      this.addNode(scene[key])
    }
  }

  addSceneGraphListener(l: SceneGraphListener) {
    this.listeners.add(l)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Ensure that our derived data is correct.
  ////////////////////////////////////////////////////////////////////////////////

  private updateHierarchy(guid: string) {
    const node = this.scene[guid]
    const derived = this.derivedScene[guid]

    if (isParentableNode(node)) {
      const parent = this.scene[node.parent]
      const parentDerived = this.derivedScene[node.parent]
      parentDerived.children.add(guid)
    }

    for (const childGUID of derived.children) {
      const child = this.scene[childGUID]
      const childDerived = this.derivedScene[childGUID]
      if (!isParentableNode(child) || child.parent !== guid) {
        childDerived.children.delete(guid)
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Make sure derivedScene is up-to-date & notify listeners.
  // These need to be called whenever the scene graph or nodes change!
  ////////////////////////////////////////////////////////////////////////////////

  private deriveAbsoluteTransform(guid: string) {
    const node = this.scene[guid]
    const derived = this.derivedScene[guid]

    if (isParentableNode(node)) {
      const parentDerived = this.derivedScene[node.parent]
      derived.absoluteTransform = mat2d.multiply(mat2d.create(), parentDerived.absoluteTransform, node.relativeTransform)
    }
    else {
      derived.absoluteTransform = node.relativeTransform
    }

    for (const childGUID of derived.children) {
      this.deriveAbsoluteTransform(childGUID)
    }
  }

  private onNodeAdded(guid: string) {
    if (!(guid in this.derivedScene)) {
      this.derivedScene[guid] = {
        children: new Set<string>(),
        absoluteTransform: mat2d.create(),
      }
    }

    // TODO: turn the parenting & derived transform updaters into listeners

    // Update parenting
    const node = this.scene[guid]
    if (isParentableNode(node)) {
      const parentDerived = this.derivedScene[node.parent]
      parentDerived.children.add(guid)
    }

    // Update transforms
    this.deriveAbsoluteTransform(guid)

    for (const l of this.listeners) {
      l.onNodeAdded(guid)
    }
  }

  private onNodeRemoved(guid: string, node: Model.Node) {
    const derived = this.derivedScene[guid]

    // Update parenting

    for (const l of this.listeners) {
      l.onNodeRemoved(guid)
    }
  }

  private onNodeChanged(guid: string, change: Change<Model.Node>) {
    if (change.key === 'relativeTransform') {
      this.deriveAbsoluteTransform(guid)
    }

    for (const l of this.listeners) {
      l.onNodeChanged(guid, change)
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Update the scene graph.
  ////////////////////////////////////////////////////////////////////////////////

  addNode(n: Model.Node) {
    this.scene[n.guid] = observeObject<Model.Node>(n, this.nodesObserver)
  }

  addFrame(
    n: {
      parent: string,
      width: number,
      height: number,
      relativeTransform: mat2d,
      color: string
    }
  ) {
    const guid = generateGUID()
    this.addNode({
      type: 'FRAME',
      resizeToFit: false,
      guid: guid,
      ...n
    })

    return this.getNode(guid)
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Getters.
  ////////////////////////////////////////////////////////////////////////////////

  getNode(guid: string): SceneNode<any> | null {
    if (guid in this.scene && guid in this.derivedScene) {
      return new SceneNode(this.scene[guid], this.derivedScene[guid], this)
    }
    return null
  }

  getModel(): Readonly<Model.Scene> {
    return this.scene
  }
}