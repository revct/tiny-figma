import {Model} from "./types";
import {Change, observeObject, Observer} from "../helpers/observe_helpers";
import {mat2d, vec2} from "gl-matrix";
import {generateGUID} from "./editor";
import {Drawable, transformDrawable} from "./graphics";
import set = Reflect.set;
import FrameNode = Model.FrameNode;
import {invert} from "../helpers/matrix_helpers";
import CanvasNode = Model.CanvasNode;

export interface SceneGraphListener {
  onNodeAdded: (guid: string) => void
  onNodeRemoved: (guid: string) => void
  onNodeChanged: (guid: string, change: Change<Model.Node>) => void
}

export type HitCheck = {
  inside?: boolean
  corners?: boolean
  edges?: boolean
}

export enum HitResult {
  NONE = 'NONE',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  TOP_LEFT = 'TOP_LEFT',
  TOP_RIGHT = 'TOP_RIGHT',
  BOTTOM_LEFT = 'BOTTOM_LEFT',
  BOTTOM_RIGHT = 'BOTTOM_RIGHT',
  INSIDE = 'INSIDE'
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

  isCanvas(): this is SceneNode<CanvasNode> {
    return Model.isCanvas(this.data)
  }

  set<K extends keyof TNode>(key: K, value: TNode[K]) {
    this.data[key] = value
  }

  get<K extends keyof TNode>(key: K): TNode[K] {
    return this.data[key]
  }

  hits(absolutePoint: vec2, threshold: number, check?: HitCheck): HitResult {
    if (check == null) {
      check = { inside: true, corners: true, edges: true }
    }

    // Convenience method for returning HitResult.NONE if HitCheck does not specify that
    // we should return the found HitResult.
    const fallback = (shouldReturnResult: boolean | undefined, result: HitResult) => {
      return shouldReturnResult ? result : HitResult.NONE
    }

    const nodePoint = vec2.transformMat2d(vec2.create(), absolutePoint, invert(this.derived.absoluteTransform))

    if (this.isFrame()) {
      const w = this.get('width')
      const h = this.get('height')
      const [x, y] = nodePoint
      const t = threshold

      if (x < -t || x > w + t || y < -t || y > h + t) { return HitResult.NONE }
      if (x >= t && x <= w - t && y >= t && y <= h - t) { return fallback(check.inside, HitResult.INSIDE) }

      if (x <= t && y <= t) { return fallback(check.corners, HitResult.TOP_LEFT) }
      if (x >= w - t && y <= t) { return fallback(check.corners, HitResult.TOP_RIGHT) }
      if (x >= w - t && y >= h - t) { return fallback(check.corners, HitResult.BOTTOM_RIGHT) }
      if (x <= t && y >= h - t) { return fallback(check.corners, HitResult.BOTTOM_LEFT) }

      if (x <= t) { return fallback(check.edges, HitResult.LEFT) }
      if (x >= w - t) { return fallback(check.edges, HitResult.RIGHT) }
      if (y <= t) { return fallback(check.edges, HitResult.TOP) }
      if (y >= h - t) { return fallback(check.edges, HitResult.BOTTOM) }
    }

    if (this.isCanvas()) {
      return HitResult.INSIDE
    }

    return HitResult.NONE
  }

  render(): Drawable[] {
    if (Model.isFrame(this.data)) {
      const topLeftCorner: vec2 = vec2.fromValues(0, 0)
      const topRightCorner: vec2 = vec2.fromValues(this.data.width, 0)
      const bottomRightCorner: vec2 = vec2.fromValues(this.data.width, this.data.height)
      const bottomLeftCorner: vec2 = vec2.fromValues(0, this.data.height)

      return [
        transformDrawable({
          type: 'POLYGON',
          color: this.data.color,
          points: [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]
        }, this.derived.absoluteTransform)
      ]
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
  // Make sure derivedScene is up-to-date & notify listeners.
  // These need to be called whenever the scene graph or nodes change!
  ////////////////////////////////////////////////////////////////////////////////

  private deriveAbsoluteTransform(guid: string) {
    const node = this.scene[guid]
    const derived = this.derivedScene[guid]

    if (node.parent != null) {
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

  private addDerivedChild(parentGUID: string, childGUID: string) {
    const parentDerived = this.derivedScene[parentGUID]
    parentDerived.children.add(childGUID)
  }

  private removeDerivedChild(parentGUID: string, childGUID: string) {
    const parentDerived = this.derivedScene[parentGUID]
    parentDerived.children.delete(childGUID)
  }

  private onNodeAdded(guid: string) {
    const node = this.scene[guid]
    if (!(guid in this.derivedScene)) {
      this.derivedScene[guid] = {
        children: new Set<string>(),
        absoluteTransform: mat2d.create(),
      }
    }

    // TODO: turn the parenting & derived transform updaters into listeners

    // Update parenting
    if (node.parent != null) {
      this.addDerivedChild(node.parent, guid)
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
    if (node.parent != null) {
      this.removeDerivedChild(node.parent, guid)
    }

    for (const l of this.listeners) {
      l.onNodeRemoved(guid)
    }
  }

  private onNodeChanged(guid: string, change: Change<Model.Node>) {
    if (change.key === 'relativeTransform') {
      this.deriveAbsoluteTransform(guid)
    }

    if (change.key === 'parent') {
      if (change.oldValue) this.removeDerivedChild(change.oldValue, guid)
      if (change.newValue) this.removeDerivedChild(change.newValue, guid)

      this.deriveAbsoluteTransform(guid)
    }

    for (const l of this.listeners) {
      l.onNodeChanged(guid, change)
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Update the scene graph.
  ////////////////////////////////////////////////////////////////////////////////

  removeNode(guid: string) {
    const node = this.scene[guid]
    if (node == null) return

    node.parent = undefined
  }

  addNode(n: Model.Node) {
    this.scene[n.guid] = observeObject<Model.Node>(n, this.nodesObserver)
  }

  addFrame(
    n: {
      parent: string,
      width: number,
      height: number,
      relativeTransform: mat2d,
      color: string,
      guid?: string // only specify this when testing!
    },
  ) {
    const guid = n.guid == null ? generateGUID() : n.guid

    this.addNode({
      type: 'FRAME',
      resizeToFit: false,
      guid: guid,
      ...n
    })

    return this.getNode(guid)
  }

  addCanvas(
    guid?: string // only specify this when testing!
  ) {
    if (!guid) guid = generateGUID()

    this.addNode({
      type: 'CANVAS',
      guid: guid,
      relativeTransform: mat2d.create()
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

  hits(rootGUID: string, absolutePoint: vec2, threshold: number, check?: HitCheck): [HitResult, string | null] {
    const root = this.getNode(rootGUID) as SceneNode<any>
    const rootResult = root.hits(absolutePoint, threshold, check)

    if (rootResult !== HitResult.NONE) {
      for (const childGUID of root.children()) {
        const [grandchildResult, grandchildGUID] = this.hits(childGUID, absolutePoint, threshold, check)
        if (grandchildResult !== HitResult.NONE) {
          return [grandchildResult, grandchildGUID]
        }
      }
      return [rootResult, rootGUID]
    }

    return [HitResult.NONE, null]
  }

  ////////////////////////////////////////////////////////////////////////////////
  // For testing + debugging.
  ////////////////////////////////////////////////////////////////////////////////

  hierarchyString(rootGUID: string): string {
    let root = this.getNode(rootGUID)
    if (root == null) {
      return ''
    }

    let childrenStrings = []
    for (const childGUID of root.children()) {
      childrenStrings.push(this.hierarchyString(childGUID))
    }

    if (childrenStrings.length) {
      return `${root.get('guid')}[${childrenStrings.join(',')}]`
    } else {
      return `${root.get('guid')}`
    }
  }
}