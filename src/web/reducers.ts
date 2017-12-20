import {actionCreators} from './actions';
import {Action} from '../helpers/redux_helpers';
import {combineReducers, Reducer} from 'redux'
import {Fullscreen} from "../fullscreen/types";

export type SceneGraphNode = {
  readonly guid: string
  type: Fullscreen.NodeType
  resizeToFit?: boolean
  parent?: string // The GUID of the parent node
  position: number // Children are sorted using this as a key
  children: string[] // The GUIDs of child nodes
}

export type MutableSceneGraph = {
  [nodeId: string]: SceneGraphNode
}

export type SceneGraph = {
  mutableSceneGraph: MutableSceneGraph
}

export type State = {
  readonly counter: number,
  readonly sceneGraph: SceneGraph
}

const counter = (state: number = 0, action: Action<any>): number => {
  if (actionCreators.incrementCounter.matches(action)) {
    return state + 1
  }
  if (actionCreators.incrementCounterBy.matches(action)) {
    return state + action.payload.amount
  }
  return state
}

const sceneGraph = (state: SceneGraph = {mutableSceneGraph: {}}, action: Action<any>): SceneGraph => {
  if (actionCreators.notifyUpdatedSceneGraph.matches(action)) {
    return {
      mutableSceneGraph: state.mutableSceneGraph
    }
  }
  if (actionCreators.injectSceneGraph.matches(action)) {
    return {
      mutableSceneGraph: action.payload
    }
  }
  return state
}


export const reducer: Reducer<State> = combineReducers({
  counter,
  sceneGraph
});


