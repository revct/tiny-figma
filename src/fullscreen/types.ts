
import {mat2d} from "gl-matrix";

export namespace Fullscreen {
  export type NodeType = 'CANVAS' | 'FRAME'

  export type SceneGraphNode = {
    readonly guid: string

    // Type
    type: NodeType
    resizeToFit?: boolean // Only necessary for frames

    // Hierarchy
    parent?: string // The GUID of the parent node
    position: number // Children are sorted using this as a key
    children: string[] // The GUIDs of child nodes

    // Location
    relativeTransform: mat2d
    width: number
    height: number
  }

  export type SceneGraph = {
    [nodeId: string]: SceneGraphNode
  }

  export type AppModel = {
    page: string // the root canvas
  }
}