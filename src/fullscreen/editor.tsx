
import {Canvas, Drawable} from "./graphics";
import {vec2, mat2d} from 'gl-matrix'
import {invert} from "../helpers/matrix_helpers";
import {Model} from "./types";
import {Dispatch} from "react-redux";
import {Change, observeObject} from "../helpers/observe_helpers";
import {actions} from "../web/actions";
import {SceneGraph, SceneGraphListener, SceneNode} from "./scene";
import {FrameMouseBehavior, MouseBehavior, MouseBehaviorEvent, SelectionMouseBehavior} from "./behaviors";


let _nextGUID = 0
export const generateGUID = () => {
  return `${_nextGUID ++}`
}

// TODO: turn this into an interator when I figure out how to get them to work in Typescript
const transformArray = (points: vec2[], transform: mat2d): vec2[] => {
  return points.map((point: vec2): vec2 => {
    const result: vec2 = vec2.create()
    vec2.transformMat2d(result, point, transform)
    return result
  })
}
const transformDrawables = (drawables: Drawable[], transform: mat2d): Drawable[] => {
  return drawables.map((d: Drawable): Drawable => {
    switch (d.type) {
      case 'RECTANGLE':
        return {
          ...d,
          topLeftCorner: vec2.transformMat2d(vec2.create(), d.topLeftCorner, transform),
          bottomRightCorner: vec2.transformMat2d(vec2.create(), d.bottomRightCorner, transform)
        }
      case 'LINE':
        return {
          ...d,
          points: transformArray(d.points, transform)
        }
      case 'BACKGROUND':
        return d
      default:
        return d
    }
  })
}

const AXIS_LINES = [
  [
    vec2.fromValues(0, -10),
    vec2.fromValues(0, 0),
    vec2.fromValues(10, 0),
  ],
  [
    vec2.fromValues(-0.5, -9.5),
    vec2.fromValues(0, -10),
    vec2.fromValues(0.5, -9.5),
  ],
  [
    vec2.fromValues(9.5, -0.5),
    vec2.fromValues(10, 0),
    vec2.fromValues(9.5, 0.5),
  ]
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

export class Editor implements SceneGraphListener {
  // Where we render.
  canvas: Canvas

  // What are we looking at?
  cameraMatrix: mat2d

  // The state of the application
  sceneGraph: SceneGraph
  appModel: Model.App

  mouseBehaviors: MouseBehavior[]
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
    appModel: Model.App
  ) {
    this.canvas = new Canvas(canvasEl)
    this.cameraMatrix = mat2d.fromTranslation(mat2d.create(), [this.canvas.width() * 0.5, this.canvas.height() * 0.5])
    this.sceneGraph = sceneGraph
    this.appModel = appModel

    this.sceneGraph.addSceneGraphListener(this)
    this.wasUpdated = {sceneGraph: false, appModel: false}

    this.updateMouseBehaviors()

    const getMouseLocation = (event: MouseEvent | MouseWheelEvent): vec2 => {
      return vec2.fromValues(
        event.clientX - canvasEl.offsetLeft,
        event.clientY - canvasEl.offsetTop
      )
    }

    const getMouseBehaviorEvent = (event: MouseEvent) => {
      const viewportXY: vec2 = getMouseLocation(event)
      return new MouseBehaviorEvent(viewportXY, this.cameraMatrix)
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
      const behaviorEvent = getMouseBehaviorEvent(event)
      for (const behavior of this.mouseBehaviors) {
        if (behavior.handleMouseDown(behaviorEvent)) {
          this.activeBehavior = behavior
        }
      }
    }
    canvasEl.onmouseup = (event: MouseEvent) => {
      if (this.activeBehavior)
        this.activeBehavior.handleMouseUp(getMouseBehaviorEvent(event))
    }
    canvasEl.onmousemove = (event: MouseEvent) => {
      if (this.activeBehavior) {
        if (event.buttons) {
          this.activeBehavior.handleMouseDrag(getMouseBehaviorEvent(event))
        } else {
          this.activeBehavior.handleMouseMove(getMouseBehaviorEvent(event))
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
    switch (this.appModel.currentTool) {
      case Model.Tool.DEFAULT:
        this.mouseBehaviors = [new SelectionMouseBehavior()]
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
    this.wasUpdated.appModel = true
  }
  onNodeAdded(guid: string) {
    this.wasUpdated.sceneGraph = true
  }
  onNodeRemoved(guid: string) {
    this.wasUpdated.sceneGraph = true
  }
  onNodeChanged(guid: string, change: Change<Model.Node>) {
    this.wasUpdated.sceneGraph = true
  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  switchTool(tool: Model.Tool) {
    this.appModel.currentTool = tool
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

  private recursivelyRender(node: SceneNode) {
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
    this.canvas.drawBackground('#fafafa')
    for (const path of AXIS_LINES) {
      this.canvas.drawLine('#aaa', transformArray(path, this.cameraMatrix))
    }

    const root = this.sceneGraph.getNode(this.appModel.page)
    if (root) {
      this.recursivelyRender(root)
    }

    this.canvas.flush()
  }
}