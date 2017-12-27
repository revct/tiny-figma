import {mat2d, vec2} from "gl-matrix";
import {Drawable} from "./graphics";
import {absoluteToViewport, generateGUID, viewportToAbsolute} from "./editor";
import {SceneGraph, SceneNode} from "./scene";
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

  viewportDistanceToAbsolutePosition(otherAbsoluteXY: vec2): number {
    const otherViewportXY = absoluteToViewport(otherAbsoluteXY, this.cameraMatrix)
    return vec2.dist(otherViewportXY, this.viewportXY)
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
  handleMouseDown(event: MouseBehaviorEvent): boolean {
    return false
  }

  handleMouseUp(event: MouseBehaviorEvent): void {
  }

  handleMouseMove(event: MouseBehaviorEvent): void {
  }

  handleMouseDrag(event: MouseBehaviorEvent): void {
  }

  render(): Drawable[] {
    return []
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