import {HitResult, SceneGraph, SceneNode} from "./scene";
import {mat2d, vec2} from "gl-matrix";
import * as assert from "assert";
import {Model} from "./types";
import FrameNode = Model.FrameNodeProperties;

describe('hit testing works', () => {
  it('for an individual node', () => {
    const scene = new SceneGraph({});
    scene.addCanvas('canvas')
    scene.addFrame({
      guid: 'frame1',
      parent: 'canvas',
      width: 10,
      height: 20,
      relativeTransform: mat2d.create(),
      color: 'red'
    })

    const node = scene.getNode('frame1') as SceneNode<any>
    assert.equal(node.hits(vec2.fromValues(0, 0), 1), HitResult.TOP_LEFT)
    assert.equal(node.hits(vec2.fromValues(10, 0), 1), HitResult.TOP_RIGHT)
    assert.equal(node.hits(vec2.fromValues(10, 20), 1), HitResult.BOTTOM_RIGHT)
    assert.equal(node.hits(vec2.fromValues(0, 20), 1), HitResult.BOTTOM_LEFT)

    assert.equal(node.hits(vec2.fromValues(5, -1.1), 1), HitResult.NONE)
    assert.equal(node.hits(vec2.fromValues(5, -0.5), 1), HitResult.TOP)
    assert.equal(node.hits(vec2.fromValues(5, 0.5), 1), HitResult.TOP)
    assert.equal(node.hits(vec2.fromValues(5, 1.1), 1), HitResult.INSIDE)

    assert.equal(node.hits(vec2.fromValues(5, 18.9), 1), HitResult.INSIDE)
    assert.equal(node.hits(vec2.fromValues(5, 19.5), 1), HitResult.BOTTOM)
    assert.equal(node.hits(vec2.fromValues(5, 20.5), 1), HitResult.BOTTOM)
    assert.equal(node.hits(vec2.fromValues(5, 21.1), 1), HitResult.NONE)

    assert.equal(node.hits(vec2.fromValues(-1.1, 10), 1), HitResult.NONE)
    assert.equal(node.hits(vec2.fromValues(-0.5, 10), 1), HitResult.LEFT)
    assert.equal(node.hits(vec2.fromValues(0.5, 10), 1), HitResult.LEFT)
    assert.equal(node.hits(vec2.fromValues(1.1, 10), 1), HitResult.INSIDE)

    assert.equal(node.hits(vec2.fromValues(8.9, 10), 1), HitResult.INSIDE)
    assert.equal(node.hits(vec2.fromValues(9.5, 10), 1), HitResult.RIGHT)
    assert.equal(node.hits(vec2.fromValues(10.5, 10), 1), HitResult.RIGHT)
    assert.equal(node.hits(vec2.fromValues(11.1, 10), 1), HitResult.NONE)
  })

  it('for scene full of nodes', () => {
    const scene = new SceneGraph({});
    scene.addCanvas('canvas')
    scene.addFrame({
      guid: 'frame1',
      parent: 'canvas',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'red'
    })
    scene.addFrame({
      guid: 'frame2',
      parent: 'frame1',
      width: 50,
      height: 50,
      relativeTransform: mat2d.fromTranslation(mat2d.create(), [25, 25]),
      color: 'blue'
    })
    scene.addFrame({
      guid: 'frame3',
      parent: 'canvas',
      width: 100,
      height: 100,
      relativeTransform: mat2d.fromTranslation(mat2d.create(), [200, 0]),
      color: 'green'
    })

    assert.deepEqual(
      scene.hits('canvas', vec2.fromValues(-50, -50), 1),
      [HitResult.NONE, null])

    assert.deepEqual(
      scene.hits('canvas', vec2.fromValues(50, 50), 1),
      [HitResult.INSIDE, 'frame2'])

    assert.deepEqual(
      scene.hits('canvas', vec2.fromValues(20, 20), 1),
      [HitResult.INSIDE, 'frame1'])

    assert.deepEqual(
      scene.hits('canvas', vec2.fromValues(250, 50), 1),
      [HitResult.INSIDE, 'frame3'])
  })
})

describe('scene can update hierarchy', () => {
  it('can create nested frames', () => {
    const scene = new SceneGraph({});
    scene.addCanvas('canvas')
    scene.addFrame({
      guid: 'frame1',
      parent: 'canvas',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'red'
    })
    scene.addFrame({
      guid: 'frame2',
      parent: 'frame1',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'blue'
    })
    scene.addFrame({
      guid: 'frame3',
      parent: 'frame1',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'green'
    })

    assert.equal(scene.hierarchyString('canvas'), 'canvas[frame1[frame2,frame3]]')
  })
  it('can delete a leaf node', () => {
    const scene = new SceneGraph({});
    scene.addCanvas('canvas')
    scene.addFrame({
      guid: 'frame1',
      parent: 'canvas',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'red'
    })
    scene.addFrame({
      guid: 'frame2',
      parent: 'frame1',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'blue'
    })
    assert.equal(scene.hierarchyString('canvas'), 'canvas[frame1[frame2]]')

    scene.removeNode('frame2')
    assert.equal(scene.hierarchyString('canvas'), 'canvas[frame1]')
  })
  it('can delete a hierarchy of nodes', () => {
    const scene = new SceneGraph({});
    scene.addCanvas('canvas')
    scene.addFrame({
      guid: 'frame1',
      parent: 'canvas',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'red'
    })
    scene.addFrame({
      guid: 'frame2',
      parent: 'frame1',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'blue'
    })
    scene.addFrame({
      guid: 'frame3',
      parent: 'frame1',
      width: 100,
      height: 100,
      relativeTransform: mat2d.create(),
      color: 'green'
    })
    assert.equal(scene.hierarchyString('canvas'), 'canvas[frame1[frame2,frame3]]')

    scene.removeNode('frame1')
    assert.equal(scene.hierarchyString('canvas'), 'canvas')
  })
})