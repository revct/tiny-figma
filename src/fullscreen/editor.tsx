
import  {Canvas} from "../helpers/graphics_helpers";
import {vec2, mat2d} from 'gl-matrix'
import {invert} from "../helpers/matrix_helpers";
import {Fullscreen} from "./types";
import SceneGraph = Fullscreen.SceneGraph;
import AppModel = Fullscreen.AppModel;
import SceneGraphNode = Fullscreen.SceneGraphNode;
import Tool = Fullscreen.Tool;
import {Dispatch} from "react-redux";
import {actions} from "../web/actions";


// TODO: turn this into an interator when I figure out how to get them to work in Typescript
const transformArray = (points: vec2[], transform: mat2d): vec2[] => {
  return points.map((point: vec2): vec2 => {
    const result: vec2 = vec2.create()
    vec2.transformMat2d(result, point, transform)
    return result
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

const getMouseLocation = (el: HTMLCanvasElement, event: MouseEvent | MouseWheelEvent): vec2 => {
  return vec2.fromValues(
    event.clientX - el.offsetLeft,
    event.clientY - el.offsetTop
  )
}

const getMouseDeltaFromMiddle = (el: HTMLCanvasElement, event: MouseEvent | MouseWheelEvent): vec2 => {
  return vec2.fromValues(
    (event.clientX - el.offsetLeft) - el.width * 0.5,
    (event.clientY - el.offsetTop) - el.height * 0.5
  )
}

export const zoomCameraRetainingOrigin = (A: mat2d, scale: number, x: vec2): mat2d => {
  const nx:vec2 = vec2.negate(vec2.create(), x)

  mat2d.multiply(A, mat2d.fromTranslation(mat2d.create(), nx), A)
  mat2d.multiply(A, mat2d.fromScaling(mat2d.create(), [scale, scale]), A)
  mat2d.multiply(A, mat2d.fromTranslation(mat2d.create(), x), A)

  return A
}

export class Editor {
  canvas: Canvas
  cameraMatrix: mat2d
  sceneGraph: SceneGraph
  appModel: AppModel
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

    canvasEl.onmousemove = (event: MouseEvent) => {
      const viewportPosition: vec2 = getMouseLocation(canvasEl, event)
      const absolutePosition = vec2.transformMat2d(vec2.create(), viewportPosition, invert(this.cameraMatrix))
    }

    canvasEl.onmousewheel = (event: MouseWheelEvent) => {
      if (Math.abs(event.wheelDelta) > 100) {
        const viewportMouse: vec2 = getMouseLocation(canvasEl, event)
        const zoom = 1 + 0.05 * event.wheelDelta / 120

        this.cameraMatrix = zoomCameraRetainingOrigin(this.cameraMatrix, zoom, viewportMouse)
      }
      else {
        mat2d.translate(this.cameraMatrix, this.cameraMatrix, [event.deltaX, event.deltaY])
      }

      event.preventDefault()
    }
  }

  switchTool(tool: Tool) {
    this.appModel.currentTool = tool
    this.sendActionToWeb(actions.toWeb.notifyUpdatedAppModel())
  }

  think(ms: number) {
  }

  private recursivelyRender(node: SceneGraphNode, m: mat2d) {
    const mm: mat2d = mat2d.multiply(mat2d.create(), m, node.relativeTransform)

    if (node.type == 'FRAME') {
      const topLeftCorner: vec2 = vec2.fromValues(0, 0)
      const bottomRightCorner: vec2 = vec2.fromValues(node.width, node.height)

      // This code does not handle rotation!
      vec2.transformMat2d(topLeftCorner, topLeftCorner, mm)
      vec2.transformMat2d(bottomRightCorner, bottomRightCorner, mm)

      this.canvas.drawRect('#cfc', topLeftCorner, bottomRightCorner)
    }

    for (const childGUID of node.children) {
      const child = this.sceneGraph[childGUID] as SceneGraphNode
      this.recursivelyRender(child, mm)
    }
  }

  render() {
    const m: mat2d = mat2d.create()
    mat2d.multiply(m, this.cameraMatrix, m)

    this.canvas.drawBackground('#fafafa')
    for (const path of AXIS_LINES) {
      this.canvas.drawLine('#aaa', transformArray(path, m))
    }

    const root = this.sceneGraph[this.appModel.page] as SceneGraphNode
    this.recursivelyRender(root, m)

    this.canvas.flush()
  }
}