import {Model} from "./types";
import {Change, observeObject, Observer} from "../helpers/observe_helpers";
import {mat2d, vec2} from "gl-matrix";
import {generateGUID} from "./editor";
import {Drawable, transformDrawable} from "./graphics";
import {invert} from "../helpers/matrix_helpers";

export interface SceneGraphListener {
  onNodeAdded: (guid: string) => void
  onNodeRemoved: (guid: string) => void
  onNodeChanged: (guid: string, change: Change<Model.NodeProperties>) => void
}

export type HitCheck = {
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

// const getReadonlySceneNode()

export class SceneNode<TNodeProperties extends Model.NodeProperties> {
  private nodeProperties: TNodeProperties
  private derivedProperties: Model.DerivedNodeProperties
  private scene: SceneGraph

  constructor(data: TNodeProperties, derived: Model.DerivedNodeProperties, scene: SceneGraph) {
    this.nodeProperties = data
    this.derivedProperties = derived
    this.scene = scene
  }

  children(): ReadonlySet<string> {
    return this.derivedProperties.children
  }

  constraints() {
    return this.derivedProperties.constraints
  }

  hasDescendant(guid: string): boolean {
    for (const childGUID of this.children()) {
      if (childGUID === guid) {
        return true
      }

      const child = this.scene.getNode(childGUID)
      if (child && child.hasDescendant(guid)) {
        return true
      }
    }
    return false
  }

  isFrame(): this is SceneNode<Model.FrameNodeProperties> {
    return Model.isFrame(this.nodeProperties)
  }

  isCanvas(): this is SceneNode<Model.CanvasNodeProperties> {
    return Model.isCanvas(this.nodeProperties)
  }

  set<K extends keyof TNodeProperties>(key: K, value: TNodeProperties[K]) {
    this.nodeProperties[key] = value
  }

  get<K extends keyof TNodeProperties>(key: K): TNodeProperties[K] {
    return this.nodeProperties[key]
  }

  hits(absolutePoint: vec2, threshold: number, check?: HitCheck): HitResult {
    if (check == null) {
      check = { corners: true, edges: true }
    }

    // Convenience method for returning `backup` if `HitCheck` does not specify that
    // we should return `result`.
    const fallback = (shouldReturnResult: boolean | undefined, result: HitResult, backup: HitResult = HitResult.INSIDE) => {
      return shouldReturnResult ? result : backup
    }

    const nodePoint = vec2.transformMat2d(vec2.create(), absolutePoint, invert(this.derivedProperties.absoluteTransform))

    if (this.isFrame()) {
      const w = this.get('width')
      const h = this.get('height')
      const [x, y] = nodePoint
      const t = threshold

      if (x < -t || x > w + t || y < -t || y > h + t) { return HitResult.NONE }
      if (x >= t && x <= w - t && y >= t && y <= h - t) { return HitResult.INSIDE }

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
    if (Model.isFrame(this.nodeProperties)) {
      const topLeftCorner: vec2 = vec2.fromValues(0, 0)
      const topRightCorner: vec2 = vec2.fromValues(this.nodeProperties.width, 0)
      const bottomRightCorner: vec2 = vec2.fromValues(this.nodeProperties.width, this.nodeProperties.height)
      const bottomLeftCorner: vec2 = vec2.fromValues(0, this.nodeProperties.height)

      return [
        transformDrawable({
          type: 'POLYGON',
          fill: { color: this.nodeProperties.color },
          points: [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]
        }, this.derivedProperties.absoluteTransform)
      ]
    }

    return []
  }

  renderOutline({padding, weight, color}: {padding: number, weight: number, color: string}): Drawable[] {
    if (Model.isFrame(this.nodeProperties)) {
      const topLeftCorner: vec2 = vec2.fromValues(-padding, -padding)
      const topRightCorner: vec2 = vec2.fromValues(this.nodeProperties.width + padding, -padding)
      const bottomRightCorner: vec2 = vec2.fromValues(this.nodeProperties.width + padding, this.nodeProperties.height + padding)
      const bottomLeftCorner: vec2 = vec2.fromValues(-padding, this.nodeProperties.height + padding)

      return [
        transformDrawable({
          type: 'POLYGON',
          stroke: { color: color, weight: weight },
          points: [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner, topLeftCorner]
        }, this.derivedProperties.absoluteTransform)
      ]
    }

    return []
  }
}

export class ChildrenDeriver implements SceneGraphListener {
  private scene: Readonly<Model.Scene>
  private derivedScene: Model.DerivedScene

  constructor(scene: Readonly<Model.Scene>, derivedScene: Model.DerivedScene) {
    this.scene = scene
    this.derivedScene = derivedScene
  }

  addDerivedChild(parentGUID: string, childGUID: string) {
    const parentDerived = this.derivedScene[parentGUID]
    parentDerived.children.add(childGUID)
  }

  removeDerivedChild(parentGUID: string, childGUID: string) {
    const parentDerived = this.derivedScene[parentGUID]
    parentDerived.children.delete(childGUID)
  }

  onNodeAdded(guid: string) {
    const node = this.scene[guid]
    if (node.parent != null) {
      this.addDerivedChild(node.parent, guid)
    }
  }

  onNodeRemoved(guid: string) {
    const node = this.scene[guid]
    if (node.parent != null) {
      this.removeDerivedChild(node.parent, guid)
    }
  }

  onNodeChanged(guid: string, change: Change<Model.NodeProperties>) {
    if (change.key === 'parent') {
      if (change.oldValue) this.removeDerivedChild(change.oldValue, guid)
      if (change.newValue) this.removeDerivedChild(change.newValue, guid)
    }
  }
}

export class AbsoluteTransformDeriver {
  private scene: Readonly<Model.Scene>
  private derivedScene: Model.DerivedScene

  constructor(scene: Readonly<Model.Scene>, derivedScene: Model.DerivedScene) {
    this.scene = scene
    this.derivedScene = derivedScene
  }

  deriveAbsoluteTransform(guid: string) {
    const node = this.scene[guid]
    const derived = this.derivedScene[guid]

    if (node == null || derived == null) {
      console.error('failed to derive transform due to null node')
      return
    }

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

  onNodeAdded(guid: string) {
    this.deriveAbsoluteTransform(guid)
  }

  onNodeRemoved(guid: string) {
    // nothing
  }

  onNodeChanged(guid: string, change: Change<Model.NodeProperties>) {
    if (change.key === 'relativeTransform') {
      this.deriveAbsoluteTransform(guid)
    }
    else if (change.key === 'parent') {
      this.deriveAbsoluteTransform(guid)
    }
  }
}

export class ConstraintsDeriver {

  private scene: Readonly<Model.Scene>
  private derivedScene: Model.DerivedScene

  constructor(scene: Readonly<Model.Scene>, derivedScene: Model.DerivedScene) {
    this.scene = scene
    this.derivedScene = derivedScene
  }

  deriveConstraints(guid: string) {
    const node = this.scene[guid]
    const derived = this.derivedScene[guid]

    if (node == null || derived == null) {
      console.error('failed to derive transform due to null node')
      return
    }

    const xy = vec2.transformMat2d(vec2.create(), vec2.fromValues(0, 0), node.relativeTransform)

    derived.constraints.left = xy[0]
    derived.constraints.top = xy[1]
  }

  onNodeAdded(guid: string) {
    this.deriveConstraints(guid)
  }

  onNodeRemoved(guid: string) {
  }

  onNodeChanged(guid: string, change: Change<Model.NodeProperties>) {
    if (change.key === 'relativeTransform') {
      this.deriveConstraints(guid)
    }
  }
}

export class SceneGraph {
  private scene: Model.Scene
  private readonly derivedScene: Model.DerivedScene

  private sceneObserver: Observer<Model.Scene> = new Observer()
  private nodesObserver: Observer<Model.NodeProperties> = new Observer()

  private listener: SceneGraphListener
  private derivers: SceneGraphListener[]

  constructor(scene: Model.Scene) {
    this.scene = observeObject<Model.Scene>({}, this.sceneObserver)
    this.derivedScene = {}

    this.derivers = [
      new ChildrenDeriver(this.scene, this.derivedScene),
      new AbsoluteTransformDeriver(this.scene, this.derivedScene),
      new ConstraintsDeriver(this.scene, this.derivedScene)
    ]

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
    this.nodesObserver.addListener((c: Change<Model.NodeProperties>) => {
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

  setSceneGraphListener(l: SceneGraphListener) {
    if (this.listener) {
      console.error('already had a scene graph listener... why did you swap it?')
    }
    this.listener = l
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Make sure derivedScene is up-to-date & notify listeners.
  // These need to be called whenever the scene graph or nodes change!
  ////////////////////////////////////////////////////////////////////////////////

  private onNodeAdded(guid: string) {
    if (!(guid in this.derivedScene)) {
      this.derivedScene[guid] = {
        children: new Set<string>(),
        absoluteTransform: mat2d.create(),
        constraints: {
          left: -1,
          top: -1
        }
      }
    }

    for (const d of this.derivers) {
      d.onNodeAdded(guid)
    }

    if (this.listener) {
      this.listener.onNodeAdded(guid)
    }
  }

  private onNodeRemoved(guid: string, node: Model.NodeProperties) {
    if (guid in this.derivedScene) {
      delete this.derivedScene[guid]
    }

    for (const d of this.derivers) {
      d.onNodeRemoved(guid)
    }

    if (this.listener) {
      this.listener.onNodeRemoved(guid)
    }
  }

  private onNodeChanged(guid: string, change: Change<Model.NodeProperties>) {
    for (const d of this.derivers) {
      d.onNodeChanged(guid, change)
    }

    if (this.listener) {
      this.listener.onNodeChanged(guid, change)
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

  addNode(n: Model.NodeProperties) {
    this.scene[n.guid] = observeObject<Model.NodeProperties>(n, this.nodesObserver)
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

  getSceneData(): Readonly<Model.Scene> {
    return this.scene
  }

  getDerivedData(): Readonly<Model.DerivedScene> {
    return this.derivedScene
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
      if (!root.isCanvas()) {
        return [rootResult, rootGUID]
      }
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