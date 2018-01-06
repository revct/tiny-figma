
import {Canvas, Drawable, transformArray, transformDrawables} from "./graphics";
import {vec2, mat2d} from 'gl-matrix'
import {invert} from "../helpers/matrix_helpers";
import {Model} from "./types";
import {Dispatch} from "react-redux";
import {Change, observeObject} from "../helpers/observe_helpers";
import {actions} from "../web/actions";
import {SceneGraph, SceneGraphListener, SceneNode} from "./scene";
import {
  CanvasContext,
  FrameMouseBehavior, MouseBehavior, MouseBehaviorEvent,
  SelectionMouseBehavior
} from "./behaviors";
import {AppModel, AppModelListener} from "./app_model";


let _nextGUID = 0
export const generateGUID = () => {
  return `${_nextGUID ++}`
}

const AXIS_DRAWABLES: Drawable[] = [
  {
    type: 'LINE',
    points: [
      vec2.fromValues(0, -10),
      vec2.fromValues(0, 0),
      vec2.fromValues(10, 0),
    ],
    color: '#444',
    weight: 1.0
  },
  {
    type: 'LINE',
    points: [
      vec2.fromValues(-0.5, -9.5),
      vec2.fromValues(0, -10),
      vec2.fromValues(0.5, -9.5),
    ],
    color: '#444',
    weight: 1.0
  },
  {
    type: 'LINE',
    points: [
      vec2.fromValues(9.5, -0.5),
      vec2.fromValues(10, 0),
      vec2.fromValues(9.5, 0.5),
    ],
    color: '#444',
    weight: 1.0
  }
]

export const zoomCameraRetainingOrigin = (A: mat2d, scale: number, x: vec2): mat2d => {
  const nx:vec2 = vec2.negate(vec2.create(), x)

  mat2d.multiply(A, mat2d.fromTranslation(mat2d.create(), nx), A)
  mat2d.multiply(A, mat2d.fromScaling(mat2d.create(), [scale, scale]), A)
  mat2d.multiply(A, mat2d.fromTranslation(mat2d.create(), x), A)

  return A
}

export const viewportToAbsolute = (viewportPosition: vec2, cameraMatrix: mat2d) => {
  const absolutePosition = vec2.transformMat2d(vec2.create(), viewportPosition, invert(cameraMatrix))
  return absolutePosition
}

export const absoluteToViewport = (absolutePosition: vec2, cameraMatrix: mat2d) => {
  const viewportPosition = vec2.transformMat2d(vec2.create(), absolutePosition, cameraMatrix)
  return viewportPosition
}

const UNIT = vec2.fromValues(1 / Math.sqrt(2), 1 / Math.sqrt(2))
const ZERO = vec2.fromValues(0, 0)

export const cameraScale = (cameraMatrix: mat2d): number =>  {
  const v1 = vec2.transformMat2d(vec2.create(), ZERO, cameraMatrix)
  const v2 = vec2.transformMat2d(vec2.create(), UNIT, cameraMatrix)
  return vec2.distance(v1, v2)
}

export const scaledStrokeWeight = (weight: number, cameraMatrix: mat2d): number =>  {
  return weight * cameraScale(cameraMatrix)
}

export class Editor implements SceneGraphListener, AppModelListener {
  // Where we render.
  canvas: Canvas

  // What are we looking at?
  cameraMatrix: mat2d

  // The state of the application
  sceneGraph: SceneGraph
  appModel: AppModel

  appModelListeners: AppModelListener[]
  sceneGraphListeners: SceneGraphListener[]

  mouseBehaviors: ReadonlyArray<MouseBehavior>
  activeBehavior: MouseBehavior | null

  wasUpdated: {
    sceneGraph: boolean,
    appModel: boolean
  }

  // Injected to help us communicate with web
  sendActionToWeb: Dispatch<any>

  constructor(
    canvasEl: HTMLCanvasElement,
    sceneGraph: SceneGraph,
    appModel: AppModel
  ) {
    this.canvas = new Canvas(canvasEl)
    this.cameraMatrix = mat2d.fromTranslation(mat2d.create(), [this.canvas.width() * 0.5, this.canvas.height() * 0.5])
    this.sceneGraph = sceneGraph
    this.appModel = appModel

    this.sceneGraph.setSceneGraphListener(this)
    this.appModel.setAppModelListener(this)

    this.wasUpdated = {sceneGraph: false, appModel: false}

    this.appModelListeners = []
    this.sceneGraphListeners = []

    this.updateMouseBehaviors()

    const getMouseLocation = (event: MouseEvent | MouseWheelEvent): vec2 => {
      return vec2.fromValues(
        event.clientX - canvasEl.offsetLeft,
        event.clientY - canvasEl.offsetTop
      )
    }

    let startViewportXY = vec2.fromValues(0, 0)

    const startMouseBehaviorEvent = (event: MouseEvent) => {
      const viewportXY = getMouseLocation(event)
      startViewportXY = viewportXY
      return {
        viewportDeltaXY: vec2.fromValues(0, 0),
        viewportXY: viewportXY,
        absoluteXY: viewportToAbsolute(viewportXY, this.cameraMatrix),
        cameraMatrix: this.cameraMatrix,
        cameraScale: cameraScale(this.cameraMatrix),
        modifierKeys: {
          shift: event.shiftKey
        }
      }
    }

    const continueMouseBehaviorEvent = (event: MouseEvent) => {
      const viewportXY = getMouseLocation(event)
      return {
        viewportDeltaXY: vec2.subtract(vec2.create(), viewportXY, startViewportXY),
        viewportXY: viewportXY,
        absoluteXY: viewportToAbsolute(getMouseLocation(event), this.cameraMatrix),
        cameraMatrix: this.cameraMatrix,
        cameraScale: cameraScale(this.cameraMatrix),
        modifierKeys: {
          shift: event.shiftKey
        }
      }
    }

    document.onkeydown = (event: KeyboardEvent) => {
      if (event.key === 'f') {
        this.switchTool(Model.Tool.FRAME)
      }
      if (event.keyCode === 27) {
        this.switchTool(Model.Tool.DEFAULT)
      }
    }
    canvasEl.onmousedown = (event: MouseEvent) => {
      const behaviorEvent = startMouseBehaviorEvent(event)
      for (const behavior of this.mouseBehaviors) {
        if (behavior.handleMouseDown(behaviorEvent)) {
          this.activeBehavior = behavior
        }
      }
    }
    canvasEl.onmouseup = (event: MouseEvent) => {
      if (this.activeBehavior)
        this.activeBehavior.handleMouseUp(continueMouseBehaviorEvent(event))
    }
    canvasEl.onmousemove = (event: MouseEvent) => {
      if (event.buttons) {
        if (this.activeBehavior) {
          this.activeBehavior.handleMouseDrag(continueMouseBehaviorEvent(event))
          return
        }
      }
      else {
        for (const behavior of this.mouseBehaviors) {
          behavior.handleMouseMove(continueMouseBehaviorEvent(event))
        }
      }
    }
    canvasEl.onmousewheel = (event: MouseWheelEvent) => {
      if (Math.abs(event.wheelDelta) > 100) {
        const viewportMouse: vec2 = getMouseLocation(event)
        const zoom = 1 + 0.05 * event.wheelDelta / 120

        this.cameraMatrix = zoomCameraRetainingOrigin(this.cameraMatrix, zoom, viewportMouse)
      }
      else {
        mat2d.translate(this.cameraMatrix, this.cameraMatrix, [event.deltaX, event.deltaY])
      }

      event.preventDefault()
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  // These functions need to be bound to the outside world!
  ////////////////////////////////////////////////////////////////////////////////
  updateMouseBehaviors() {
    this.activeBehavior = null
    switch (this.appModel.get('currentTool')) {
      case Model.Tool.DEFAULT:
        this.mouseBehaviors = [new SelectionMouseBehavior(this.sceneGraph, this.appModel)]
        break
      case Model.Tool.FRAME:
        this.mouseBehaviors = [new FrameMouseBehavior(this.sceneGraph, this.appModel)]
        break
      default:
        this.mouseBehaviors = []
        break
    }
  }
  onAppModelChange(change: Change<Model.App>) {
    if (change.key === 'currentTool' && change.oldValue !== change.newValue) {
      this.updateMouseBehaviors()
    }
    for (const l of this.appModelListeners) {
      l.onAppModelChange(change)
    }
    this.wasUpdated.appModel = true
  }
  onNodeAdded(guid: string) {
    for (const l of this.sceneGraphListeners) {
      l.onNodeAdded(guid)
    }
    this.wasUpdated.sceneGraph = true
  }
  onNodeRemoved(guid: string) {
    for (const l of this.sceneGraphListeners) {
      l.onNodeRemoved(guid)
    }
    this.wasUpdated.sceneGraph = true
  }
  onNodeChanged(guid: string, change: Change<Model.NodeProperties>) {
    for (const l of this.sceneGraphListeners) {
      l.onNodeChanged(guid, change)
    }
    this.wasUpdated.sceneGraph = true
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  switchTool(tool: Model.Tool) {
    this.appModel.set('currentTool', tool)
  }

  think(ms: number) {
    if (this.wasUpdated.appModel) {
      this.sendActionToWeb(actions.toWeb.notifyUpdatedAppModel())
      this.wasUpdated.appModel = false
    }
    if (this.wasUpdated.sceneGraph) {
      this.sendActionToWeb(actions.toWeb.notifyUpdatedSceneGraph())
      this.wasUpdated.sceneGraph = false
    }
  }

  private recursivelyRender(node: SceneNode<any>) {
    const drawables = node.render()
    this.canvas.drawDrawables(transformDrawables(drawables, this.cameraMatrix))

    for (const childGUID of node.children()) {
      const child = this.sceneGraph.getNode(childGUID)
      if (child) {
        this.recursivelyRender(child)
      }
    }
  }

  render() {
    const canvasContext: Readonly<CanvasContext> = {
      cameraMatrix: this.cameraMatrix,
      cameraScale: cameraScale(this.cameraMatrix)
    }

    this.canvas.drawBackground('#fafafa')
    this.canvas.drawDrawables(transformDrawables(AXIS_DRAWABLES, this.cameraMatrix))

    const root = this.sceneGraph.getNode(this.appModel.get('page'))
    if (root) {
      this.recursivelyRender(root)
    }

    for (const behavior of this.mouseBehaviors) {
      this.canvas.drawDrawables(transformDrawables(behavior.render(canvasContext), this.cameraMatrix))
    }

    this.canvas.flush()
  }
}