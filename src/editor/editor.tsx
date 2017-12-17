
interface Camera {
  x: number
  y: number
  zoom: number
}

export class Editor {
  context: CanvasRenderingContext2D
  camera: Camera

  constructor(canvas: HTMLCanvasElement) {
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
  }

  think(ms: number) {
  }

  render() {

  }
}