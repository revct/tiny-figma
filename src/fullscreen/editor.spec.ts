import {mat2d, vec2} from "gl-matrix";
import {zoomCameraRetainingOrigin} from "./editor";
import * as assert from "assert";

describe("zoomCameraRetainingOrigin", () => {
  [
    {
      oldTranslation: [0, 0],
      oldZoom: 1,
      newZoom: 3,
      absolutePos: [1, 0]
    },
    {
      oldTranslation: [1, 0],
      oldZoom: 1,
      newZoom: 3,
      absolutePos: [1, 0]
    },
    {
      oldTranslation: [1.5, 0.5],
      oldZoom: 1.5,
      newZoom: 5,
      absolutePos: [1, 0.5]
    }
  ].forEach(({
    oldTranslation, oldZoom, newZoom, absolutePos
  }) => {
    it(`start translation: ${oldTranslation}, start zoom: ${oldZoom}, new zoom: ${newZoom}, absolute: ${absolutePos}`, () => {
      const camera: mat2d = mat2d.create()
      mat2d.scale(camera, camera, [oldZoom, oldZoom])
      mat2d.translate(camera, camera, oldTranslation)

      const absolute: vec2 = vec2.fromValues(absolutePos[0], absolutePos[1])
      const mouse: vec2 = vec2.transformMat2d(
        vec2.create(),
        absolute,
        camera)

      console.warn(absolute, '=>', mouse)

      const newCamera: mat2d = zoomCameraRetainingOrigin(camera, newZoom, mouse)
      assert.deepEqual(vec2.transformMat2d(vec2.create(), absolute, newCamera), mouse)
    })
  })
})

describe('testing my matrix understanding', () => {
  it('works', () => {
    const scale3: mat2d = mat2d.fromScaling(mat2d.create(), [3,3])
    const translate1: mat2d = mat2d.fromTranslation(mat2d.create(), [1,0])

    const a: mat2d = mat2d.create()

    mat2d.scale(a, a, [3,3]) // 2. then scale
    mat2d.translate(a, a, [1,0]) // 1. translate first

    assert.deepEqual(
      vec2.transformMat2d(vec2.create(), vec2.fromValues(1,1), a),
      vec2.fromValues(6, 3)
    )
  })
})