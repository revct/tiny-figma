
import {mat2d} from "gl-matrix";

export namespace Model {
  export type NodeType = 'CANVAS' | 'FRAME'

  export interface BaseNode {
    readonly guid: string
    // position: number // Children are sorted using this as a key
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
    color: string
  }

  export type Node = FrameNode | CanvasNode

  export function isParentableNode(n: Node): n is FrameNode {
    return n.type === 'FRAME'
  }

  export function isFrame(n: Node): n is FrameNode {
    return n.type === 'FRAME'
  }

  export type Scene = {
    [nodeId: string]: Node
  }

  export enum Tool {
    DEFAULT = 0,
    FRAME = 1,
  }

  export type App = {
    page: string // the root canvas
    currentTool: Tool
  }
}