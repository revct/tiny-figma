import {actions} from './actions';
import {Action} from '../helpers/redux_helpers';
import {combineReducers, Reducer} from 'redux'
import {Model} from "../fullscreen/types";

export namespace Reducers {
  export type SceneGraph = {
    mutableScene: Model.Scene
    mutableDerived: Model.DerivedScene
  }

  export type AppModel = {
    mutable: Model.App
  }

  export type State = {
    readonly sceneGraph: SceneGraph
    readonly appModel: AppModel
  }

  const sceneGraph = (state: SceneGraph = {mutableDerived: {}, mutableScene: {}}, action: Action<any>): SceneGraph => {
    if (actions.toWeb.notifyUpdatedSceneGraph.matches(action)) {
      return {
        ...state
      }
    }
    if (actions.toWeb.injectSceneGraph.matches(action)) {
      return {
        ...action.payload
      }
    }
    return state
  }

  const appModel = (state: AppModel, action: Action<any>): AppModel | null => {
    if (actions.toWeb.notifyUpdatedAppModel.matches(action)) {
      return {
        mutable: state.mutable
      }
    }
    if (actions.toWeb.injectAppModel.matches(action)) {
      return {
        mutable: action.payload
      }
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
}