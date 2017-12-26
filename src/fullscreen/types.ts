
import {mat2d} from "gl-matrix";

export namespace Fullscreen {
  export type NodeType = 'CANVAS' | 'FRAME'

  export interface BaseNode {
    readonly guid: string
    position: number // Children are sorted using this as a key
    children: string[] // The GUIDs of child nodes
    relativeTransform: mat2d
  }

  export interface CanvasNode extends BaseNode {
    type: 'CANVAS'
  }

  export interface FrameNode extends BaseNode {
    type: 'FRAME'
    resizeToFit: boolean // Only necessary for frames
    parent: string // The GUID of the parent node
    width: number // Size is not present on CANVAS
    height: number
  }

  export type SceneGraphNode = FrameNode | CanvasNode

  export type SceneGraph = {
    [nodeId: string]: SceneGraphNode
  }

  export enum Tool {
    DEFAULT = 0,
    FRAME = 1,
  }

  export type AppModel = {
    page: string // the root canvas
    currentTool: Tool
  }
}