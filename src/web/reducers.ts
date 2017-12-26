import {actions} from './actions';
import {Action} from '../helpers/redux_helpers';
import {combineReducers, Reducer} from 'redux'
import {Fullscreen} from "../fullscreen/types";
import NodeType = Fullscreen.NodeType;
import AppModel = Fullscreen.AppModel;

export type SceneGraphNode = {
  readonly guid: string
  type: NodeType
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
  readonly sceneGraph: SceneGraph
  readonly appModel: AppModel
}

const sceneGraph = (state: SceneGraph = {mutableSceneGraph: {}}, action: Action<any>): SceneGraph => {
  if (actions.toWeb.notifyUpdatedSceneGraph.matches(action)) {
    return {
      mutableSceneGraph: state.mutableSceneGraph
    }
  }
  if (actions.toWeb.injectSceneGraph.matches(action)) {
    return {
      mutableSceneGraph: action.payload
    }
  }
  return state
}

const appModel = (state: AppModel, action: Action<any>): AppModel | null => {
  if (actions.toWeb.updateMirror.matches(action) && action.payload.appModel != null) {
    return {...state, ...action.payload.appModel}
  }
  if (state == null) {
    return null
  }
  return state as AppModel
}

export const reducer: Reducer<State> = combineReducers({
  sceneGraph,
  appModel
});


