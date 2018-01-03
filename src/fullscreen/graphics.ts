
import {mat2d, vec2} from 'gl-matrix'
import {createElement} from "react";

export interface Polygon {
  type: 'POLYGON'
  points: vec2[]
  fill?: {
    color: string
  }
  stroke?: {
    color: string
    weight: number
  }
}

export interface Line {
  type: 'LINE'
  color: string
  weight: number
  points: vec2[]
}

export interface Background {
  type: 'BACKGROUND'
  color: string
}

export type Drawable = Polygon | Line | Background

// TODO: turn this into an interator when I figure out how to get them to work in Typescript
export const transformArray = (points: vec2[], transform: mat2d): vec2[] => {
  return points.map((point: vec2): vec2 => {
    const result: vec2 = vec2.create()
    vec2.transformMat2d(result, point, transform)
    return result
  })
}

export const transformDrawable = (d: Drawable, transform: mat2d): Drawable => {
  switch (d.type) {
    case 'POLYGON':
      return {
        ...d,
        points: transformArray(d.points, transform)
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
}
export const transformDrawables = (drawables: Drawable[], transform: mat2d): Drawable[] => {
  return drawables.map((d: Drawable): Drawable => transformDrawable(d, transform))
}

export class Canvas {
  renderEl: HTMLCanvasElement
  renderContext: CanvasRenderingContext2D

  backEl: HTMLCanvasElement
  backContext: CanvasRenderingContext2D

  constructor(el: HTMLCanvasElement) {
    this.renderEl = el
    this.renderContext = this.renderEl.getContext('2d') as CanvasRenderingContext2D

    this.backEl = document.createElement('canvas')
    this.backContext = this.backEl.getContext('2d') as CanvasRenderingContext2D

    this.renderContext.mozImageSmoothingEnabled = false;
    this.renderContext.webkitImageSmoothingEnabled = false;
    this.renderContext.imageSmoothingEnabled = false;

    this.backContext.mozImageSmoothingEnabled = false;
    this.backContext.webkitImageSmoothingEnabled = false;
    this.backContext.imageSmoothingEnabled = false;

    this.updateSize()
  }

  updateSize() {
    this.renderEl.width  = this.renderEl.offsetWidth;
    this.renderEl.height = this.renderEl.offsetHeight;

    this.backEl.width  = this.renderEl.offsetWidth;
    this.backEl.height = this.renderEl.offsetHeight;
  }

  width() {
    return this.renderEl.width
  }

  height() {
    return this.renderEl.height
  }

  drawBackground(color: string) {
    this.backContext.fillStyle = color
    this.backContext.fillRect(0, 0, this.width(), this.height())
  }

  drawPolygon(
    d: Polygon
  ) {
    if (d.fill) {
      this.backContext.fillStyle = d.fill.color
    }
    if (d.stroke) {
      this.backContext.strokeStyle = d.stroke.color
      this.backContext.lineWidth = d.stroke.weight
    }

    this.backContext.beginPath()
    this.backContext.moveTo(d.points[0][0], d.points[0][1])
    for (let point of d.points.slice(1)) {
      this.backContext.lineTo(point[0], point[1])
    }
    this.backContext.moveTo(d.points[0][0], d.points[0][1])

    if (d.fill) this.backContext.fill()
    if (d.stroke) this.backContext.stroke()
  }

  drawLine(
    color: string,
    weight: number,
    points: vec2[],
  ) {
    this.backContext.strokeStyle = color
    this.backContext.lineWidth = weight
    this.backContext.beginPath()
    this.backContext.moveTo(points[0][0], points[0][1])
    for (let point of points.slice(1)) {
      this.backContext.lineTo(point[0], point[1])
    }
    this.backContext.stroke()
  }

  drawDrawables(ds: Drawable[]) {
    for (const d of ds) {
      switch (d.type) {
        case 'POLYGON':
          this.drawPolygon(d as Polygon)
          break
        case 'LINE':
          this.drawLine(d.color, d.weight, d.points)
          break
        case 'BACKGROUND':
          this.drawBackground(d.color)
          break
      }
    }
  }

  flush() {
    this.renderContext.drawImage(this.backEl, 0, 0);
  }
}

