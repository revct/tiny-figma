import {mat2d, vec2} from "gl-matrix";
import {Drawable} from "./graphics";
import {absoluteToViewport, cameraScale, generateGUID, viewportToAbsolute} from "./editor";
import {HitResult, SceneGraph, SceneNode} from "./scene";
import {Model} from "./types";
import {randomColorPicker} from "../helpers/primitive_helpers";
import {Change} from "../helpers/observe_helpers";
import {AppModel, Selection} from "./app_model";
import {SelectionTransformer} from "./selection_transformer";

export interface CanvasContext {
  cameraMatrix: mat2d
  cameraScale: number
}

export interface MouseBehaviorEvent {
  viewportDeltaXY: vec2
  viewportXY: vec2
  absoluteXY: vec2
  cameraMatrix: mat2d
  cameraScale: number
  modifierKeys: {
    shift: boolean,
  }
}

export interface MouseBehavior {
  handleMouseDown(event: MouseBehaviorEvent): boolean
  handleMouseUp(event: MouseBehaviorEvent): void
  handleMouseMove(event: MouseBehaviorEvent): void
  handleMouseDrag(event: MouseBehaviorEvent): void
  render(canvasContext: CanvasContext): Drawable[]
}

export class SelectionMouseBehavior implements MouseBehavior {
  scene: SceneGraph
  appModel: AppModel

  hoveringGUID: string | null
  clickContext: {
    clickedGUID: string
    wasSelectedBeforeMouseDown: boolean
  } | null
  wasDragged: boolean
  selectionTransformer: SelectionTransformer | null

  constructor(scene: SceneGraph, appModel: AppModel) {
    this.scene = scene
    this.appModel = appModel
  }

  handleMouseMove(event: MouseBehaviorEvent): void {
    const [hitResult, hitGUID] = this.scene.hits(this.appModel.get('page'), event.absoluteXY, 4.0 / event.cameraScale, {})

    if (hitResult === HitResult.INSIDE && hitGUID != null) {
      this.hoveringGUID = hitGUID
    } else {
      this.hoveringGUID = null
    }
  }

  handleMouseDown(event: MouseBehaviorEvent): boolean {
    this.hoveringGUID = null
    this.wasDragged = false
    const selection: Selection = this.appModel.selection

    let result = false

    const [hitResult, hitGUID] = this.scene.hits(this.appModel.get('page'), event.absoluteXY, 4.0 / event.cameraScale, {})
    if (hitResult === HitResult.INSIDE && hitGUID != null) {
      this.clickContext = {
        clickedGUID: hitGUID,
        wasSelectedBeforeMouseDown: selection.has(hitGUID),
      }

      if (event.modifierKeys.shift) {
        selection.add(hitGUID, this.scene)
      } else {
        if (selection.isEmpty() || !selection.has(hitGUID)) {
          selection.clobber(hitGUID)
        }
      }

      result = true
    }

    if (result) {
      this.selectionTransformer = new SelectionTransformer(selection.guids(), event.absoluteXY, this.scene)
      return true
    } else {
      selection.clear()
      this.selectionTransformer = null
      return false
    }
  }

  handleMouseUp(event: MouseBehaviorEvent): void {
    if (this.wasDragged === false && this.clickContext && this.clickContext.wasSelectedBeforeMouseDown) {
      const selection: Selection = this.appModel.selection
      if (event.modifierKeys.shift) {
        selection.delete(this.clickContext.clickedGUID)
      } else {
        selection.clobber(this.clickContext.clickedGUID)
      }
    }

    this.selectionTransformer = null
    this.hoveringGUID = null
    this.clickContext = null
    this.wasDragged = false
  }

  handleMouseDrag(event: MouseBehaviorEvent): void {
    this.wasDragged = true
    if (this.selectionTransformer) {
      this.selectionTransformer.update(event.absoluteXY, this.scene)
    }
  }

  render(canvasContext: CanvasContext): Drawable[] {
    const results = []

    const selectionPadding = 4.0 / canvasContext.cameraScale

    for (const guid of this.appModel.get('selection')) {
      const node = this.scene.getNode(guid)
      if (node) {
        for (const d of node.renderOutline({
          padding: selectionPadding,
          color: '#4ef',
          weight: 2.0
        })) {
          results.push(d)
        }
      }
    }
    if (this.hoveringGUID != null) {
      const node = this.scene.getNode(this.hoveringGUID)
      if (node) {
        for (const d of node.renderOutline({
          padding: selectionPadding,
          color: '#8ff',
          weight: 2.0
        })) {
          results.push(d)
        }
      }
    }
    return results
  }
}

export class FrameMouseBehavior implements MouseBehavior {
  scene: SceneGraph
  appModel: AppModel

  startAbsoluteXY: vec2
  endAbsoluteXY: vec2

  newGUID: string | null

  constructor(scene: SceneGraph, appModel: AppModel) {
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
      parent: this.appModel.get('page'),
      width: this.width(),
      height: this.height(),
      color: randomColorPicker(),
      relativeTransform: this.relativeTransform(),
    }) as SceneNode<any>

    this.newGUID = newNode.get('guid')
    if (this.newGUID != null) {
      this.appModel.selection.clobber(this.newGUID)
    }

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

  render(canvasContext: CanvasContext): Drawable[] {
    return []
  }
}