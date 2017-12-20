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

      const newCamera: mat2d = zoomCameraRetainingOrigin(camera, newZoom, mouse)
      assert.deepEqual(vec2.transformMat2d(vec2.create(), absolute, newCamera), mouse)
    })
  })
})

describe('testing my matrix understanding', () => {
  it('composing matrices works', () => {
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
  it('the order of values is what I expect', () => {
    const i: mat2d = mat2d.create()
    assert.equal(i[0], 1)
    assert.equal(i[1], 0)
    assert.equal(i[2], 0)
    assert.equal(i[3], 1)
    assert.equal(i[4], 0)
    assert.equal(i[5], 0)

    const t: mat2d = mat2d.fromTranslation(mat2d.create(), [2, 3])
    assert.equal(t[0], 1)
    assert.equal(t[1], 0)
    assert.equal(t[2], 0)
    assert.equal(t[3], 1)
    assert.equal(t[4], 2)
    assert.equal(t[5], 3)

    const r: mat2d = mat2d.fromTranslation(mat2d.create(), [2, 3])

  })
})

describe('typescript iterators', () => {
  it('doesn\'t work :(', () => {
    function * gen (): IterableIterator<number> {
      yield 0
      yield 1
      yield 2
    }

    // let x = gen().
  })
})