
export type NodeType = 'CANVAS' | 'FRAME'

export type SceneGraphNode = {
  readonly guid: string
  type: NodeType
  resizeToFit?: boolean
  parent?: string // The GUID of the parent node
  position: number // Children are sorted using this as a key
  children: string[] // The GUIDs of child nodes
}

export type SceneGraph = {
  [nodeId: string]: SceneGraphNode
}

export const SceneGraph  = {
  create: (): SceneGraph => {
    return {
      'root': {
        guid: 'root',
        type: 'CANVAS',
        position: Math.random(),
        children: []
      }
    }
  }
}