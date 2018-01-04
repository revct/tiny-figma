import {SceneGraph} from "./scene";
import {mat2d, vec2} from "gl-matrix";

export class SelectionTransformer {
  selection: {
    [guid: string]: {
      startingTransform: mat2d
    }
  } = {}
  startXY: vec2

  constructor(selection: Iterable<string>, startXY: vec2, scene: SceneGraph) {
    for (const guid of selection) {
      const node = scene.getNode(guid)
      if (node == null) {
        console.error('wat, couldn\'t find node')
        continue
      }

      this.selection[guid] = {
        startingTransform: node.get('relativeTransform')
      }
    }
    this.startXY = startXY
  }

  update(endXY: vec2, scene: SceneGraph) {
    const delta = vec2.subtract(vec2.create(), endXY, this.startXY)

    for (const guid in this.selection) {
      const node = scene.getNode(guid)
      if (node == null) {
        console.error('wat, couldn\'t find node')
        continue
      }

      const startingTransform = this.selection[guid].startingTransform
      const endingTransform = mat2d.multiply(mat2d.create(), mat2d.fromTranslation(mat2d.create(), delta), startingTransform)

      node.set('relativeTransform', endingTransform)
    }
  }

}
