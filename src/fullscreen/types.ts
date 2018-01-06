
import {mat2d} from "gl-matrix";
import * as Immutable from 'immutable'

export namespace Model {
  export type NodeType = 'CANVAS' | 'FRAME'

  export interface DerivedNodeProperties {
    children: Set<string>
    absoluteTransform: mat2d
    constraints: {
      // TODO: have more and fancier constraints!
      left: number
      top: number
    }
  }

  export interface DerivedScene {
    [guid: string]: DerivedNodeProperties
  }

  export interface BaseNodeProperties {
    readonly guid: string
    // position: number // Children are sorted using this as a key
    relativeTransform: mat2d
    parent?: string // The GUID of the parent node
  }

  export interface CanvasNodeProperties extends BaseNodeProperties {
    type: 'CANVAS'
  }

  export interface FrameNodeProperties extends BaseNodeProperties {
    type: 'FRAME'
    resizeToFit: boolean // Only necessary for frames
    width: number // Size is not present on CANVAS
    height: number
    color: string
  }

  export type NodeProperties = FrameNodeProperties | CanvasNodeProperties

  export function isFrame(n: NodeProperties): n is FrameNodeProperties {
    return n.type === 'FRAME'
  }

  export function isCanvas(n: NodeProperties): n is CanvasNodeProperties {
    return n.type === 'CANVAS'
  }

  export type Scene = {
    [nodeId: string]: NodeProperties
  }

  export enum Tool {
    DEFAULT = 0,
    FRAME = 1,
  }

  export type App = {
    page: Readonly<string> // the root canvas
    currentTool: Readonly<Tool>
    selection: Immutable.Set<string>
  }
}