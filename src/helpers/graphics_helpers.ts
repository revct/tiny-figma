
import { vec2 } from 'gl-matrix'
import {createElement} from "react";

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

  drawRect(
    color: string,
    topLeftCorner: vec2,
    bottomRightCorner: vec2,
  ) {
    const [x1, y1] = [topLeftCorner[0], topLeftCorner[1]]
    const [x2, y2] = [bottomRightCorner[0], bottomRightCorner[1]]
    const w = x2 - x1
    const h = y2 - y1

    this.backContext.fillStyle = color
    this.backContext.fillRect(x1, y1, w, h)
  }

  drawLine(
    color: string,
    points: vec2[],
  ) {
    this.backContext.fillStyle = color
    this.backContext.beginPath()
    this.backContext.moveTo(points[0][0], points[0][1])
    for (let point of points.slice(1)) {
      this.backContext.lineTo(point[0], point[1])
    }
    this.backContext.stroke()
  }

  flush() {
    this.renderContext.drawImage(this.backEl, 0, 0);
  }
}

