
import {Canvas} from "../helpers/graphics_helpers";
import {vec2, mat2d} from 'gl-matrix'
import {invert} from "../helpers/matrix_helpers";

const transformArray = (points: vec2[], transform: mat2d): vec2[] => {
  return points.map((point: vec2): vec2 => {
    const result: vec2 = vec2.create()
    vec2.transformMat2d(result, point, transform)
    return result
  })
}

const AXIS_LINES = [
  [
    vec2.fromValues(0.5, -10.5),
    vec2.fromValues(0.5, 0.5),
    vec2.fromValues(10.5, 0.5),
  ],
  [
    vec2.fromValues(0.5, -30.5),
    vec2.fromValues(0.5, -20.5),
  ],
  [
    vec2.fromValues(30.5, 0.5),
    vec2.fromValues(20.5, 0.5),
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

const zoomCameraRetainingOrigin = (cameraMatrix: mat2d, zoom: number, origin: vec2) => {
  const zoomMatrix: mat2d = mat2d.fromScaling(mat2d.create(), [zoom, zoom])

  const scaledOrigin: vec2 = vec2.transformMat2d(vec2.create(), origin, zoomMatrix)
  const deltaOrigin = vec2.subtract(vec2.create(), scaledOrigin, origin)

  mat2d.multiply(cameraMatrix, zoomMatrix, cameraMatrix)
  mat2d.translate(cameraMatrix, cameraMatrix, deltaOrigin)
}


export class Editor {
  canvas: Canvas

  cameraMatrix: mat2d

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvas = new Canvas(canvasEl)
    this.cameraMatrix = mat2d.fromTranslation(mat2d.create(), [this.canvas.width() * 0.5, this.canvas.height() * 0.5])

    canvasEl.onmousemove = (event: MouseEvent) => {
      const viewportPosition: vec2 = getMouseLocation(canvasEl, event)
      const absolutePosition = vec2.transformMat2d(vec2.create(), viewportPosition, invert(this.cameraMatrix))
    }

    canvasEl.onmousewheel = (event: MouseWheelEvent) => {
      if (Math.abs(event.wheelDelta) > 100) {
        const viewportMouse: vec2 = getMouseLocation(canvasEl, event)
        const zoom = 1 + 0.05 * event.wheelDelta / 120

        zoomCameraRetainingOrigin(this.cameraMatrix, zoom, viewportMouse)
      }
      else {
        mat2d.translate(this.cameraMatrix, this.cameraMatrix, [event.deltaX, event.deltaY])
      }

      event.preventDefault()

      // var zoom = 1 + wheel/2;
      //
      // mat2d.identity(this.cameraTransform)
      // mat2d.translate(this.cameraTransform, this.cameraTransform, vec2.fromValues(
      //   originX,
      //   originY
      // ))
      // mat2d.scale(this.cameraTransform, this.cameraTransform, vec2.fromValues(zoom, zoom))
      // mat2d.translate(this.cameraTransform, this.cameraTransform, vec2.fromValues(
      //   -( mouseX / scale + originX - mouseX / ( scale * zoom ) ),
      //   -( mouseY / scale + originY - mouseY / ( scale * zoom ) )
      // ))
      //
      // originX = ( mouseX / scale + originX - mouseX / ( scale * zoom ) );
      // originY = ( mouseY / scale + originY - mouseY / ( scale * zoom ) );
      // scale *= zoom;
    }
  }

  think(ms: number) {
  }

  render() {
    const m: mat2d = mat2d.create()
    mat2d.multiply(m, this.cameraMatrix, m)

    this.canvas.drawBackground('#fafafa')
    for (const path of AXIS_LINES) {
      this.canvas.drawLine('#aaa', transformArray(path, m))
    }

    this.canvas.flush()
  }
}