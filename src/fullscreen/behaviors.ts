import {mat2d, vec2} from "gl-matrix";
import {Drawable} from "./graphics";
import {absoluteToViewport, generateGUID, viewportToAbsolute} from "./editor";
import {HitResult, SceneGraph, SceneNode} from "./scene";
import {Model} from "./types";
import {randomColorPicker} from "../helpers/primitive_helpers";

export class MouseBehaviorEvent {
  viewportXY: vec2
  absoluteXY: vec2
  cameraMatrix: mat2d

  constructor(viewportXY: vec2, cameraMatrix: mat2d) {
    this.viewportXY = viewportXY
    this.absoluteXY = viewportToAbsolute(viewportXY, cameraMatrix)
    this.cameraMatrix = cameraMatrix
  }

  capturedCameraScale(): number {
    const v1 = vec2.fromValues(1, 1)
    const v2 = vec2.transformMat2d(vec2.create(), v1, this.cameraMatrix)
    return vec2.length(v2) / vec2.length(v1)
  }
}

export interface MouseBehavior {
  handleMouseDown(event: MouseBehaviorEvent): boolean
  handleMouseUp(event: MouseBehaviorEvent): void
  handleMouseMove(event: MouseBehaviorEvent): void
  handleMouseDrag(event: MouseBehaviorEvent): void
  render(): Drawable[]
}

export class SelectionMouseBehavior implements MouseBehavior {
  scene: SceneGraph
  appModel: Model.App

  hoveringGUID: string | null

  constructor(scene: SceneGraph, appModel: Model.App) {
    this.scene = scene
    this.appModel = appModel
  }

  handleMouseDown(event: MouseBehaviorEvent): boolean {
    this.hoveringGUID = null

    const [hitResult, hitGUID] = this.scene.hits(this.appModel.page, event.absoluteXY, 4.0 / event.capturedCameraScale(), {inside: true})
    if (hitResult === HitResult.INSIDE && hitGUID != null) {
      this.appModel.selection = [hitGUID]
      return true
    }

    return false
  }

  handleMouseUp(event: MouseBehaviorEvent): void {
  }

  handleMouseMove(event: MouseBehaviorEvent): void {
    const [hitResult, hitGUID] = this.scene.hits(this.appModel.page, event.absoluteXY, 4.0 / event.capturedCameraScale(), {inside: true})

    if (hitResult === HitResult.INSIDE && hitGUID != null) {
      this.hoveringGUID = hitGUID
    } else {
      this.hoveringGUID = null
    }
  }

  handleMouseDrag(event: MouseBehaviorEvent): void {
  }

  private renderSelectionForNode(node: SceneNode<any>): Drawable {
    throw ''
  }

  render(): Drawable[] {
    const results = []
    for (const guid of this.appModel.selection) {
      const node = this.scene.getNode(guid)
      if (node) {
        results.push(this.renderSelectionForNode(node))
      }
    }
    if (this.hoveringGUID != null) {
      const node = this.scene.getNode(this.hoveringGUID)
      if (node) {
        results.push(this.renderSelectionForNode(node))
      }
    }
    return results
  }
}

export class FrameMouseBehavior implements MouseBehavior {
  scene: SceneGraph
  appModel: Model.App

  startAbsoluteXY: vec2
  endAbsoluteXY: vec2

  newGUID: string | null

  constructor(scene: SceneGraph, appModel: Model.App) {
    this.scene = scene
    this.appModel = appModel
  }

  private relativeTransform() {
    return mat2d.fromTranslation(mat2d.create(), this.topLeftXY())
  }

  private topLeftXY() {
    return vec2.fromValues(
      Math.min(this.startAbsoluteXY[0], this.endAbsoluteXY[0]),
      Math.min(this.startAbsoluteXY[1], this.endAbsoluteXY[1])
    )
  }

  private bottomRightXY() {
    return vec2.fromValues(
      Math.max(this.startAbsoluteXY[0], this.endAbsoluteXY[0]),
      Math.max(this.startAbsoluteXY[1], this.endAbsoluteXY[1])
    )
  }

  private width() {
    return this.bottomRightXY()[0] - this.topLeftXY()[0]
  }

  private height() {
    return this.bottomRightXY()[1] - this.topLeftXY()[1]
  }

  handleMouseDown(event: MouseBehaviorEvent): boolean {
    this.startAbsoluteXY = event.absoluteXY
    this.endAbsoluteXY = event.absoluteXY

    let newNode = this.scene.addFrame({
      parent: this.appModel.page,
      width: this.width(),
      height: this.height(),
      color: randomColorPicker(),
      relativeTransform: this.relativeTransform(),
    }) as SceneNode<any>

    this.newGUID = newNode.get('guid')
    return true
  }

  handleMouseUp(event: MouseBehaviorEvent): void {
    this.endAbsoluteXY = event.absoluteXY

    if (!this.newGUID) return

    let newNode = this.scene.getNode(this.newGUID)
    if (!newNode) return

    if (newNode.isFrame()) {
      newNode.set('width', this.width())
      newNode.set('height', this.height())
      newNode.set('relativeTransform', this.relativeTransform())
    }

    this.newGUID = null
  }

  handleMouseMove(event: MouseBehaviorEvent): void {
  }

  handleMouseDrag(event: MouseBehaviorEvent): void {
    this.endAbsoluteXY = event.absoluteXY

    if (!this.newGUID) return

    let newNode = this.scene.getNode(this.newGUID)
    if (!newNode) return

    if (newNode.isFrame()) {
      newNode.set('width', this.width())
      newNode.set('height', this.height())
      newNode.set('relativeTransform', this.relativeTransform())
    }
  }

  render(): Drawable[] {
    return []
  }
}