import {createActionCreator} from '../helpers/redux_helpers'
import {Model} from "../fullscreen/types";
import {Reducers} from "./reducers";

// Action Creators
export const actions = {
  toWeb: {
    // In Figma, action.fullscreen.updateMirror handles updates to the scene graph by packaging
    // a series of node changes which update mutableNodes in the redux state.
    notifyUpdatedSceneGraph: createActionCreator('NOTIFY_UPDATED_SCENE_GRAPH'),
    injectSceneGraph: createActionCreator<Reducers.SceneGraph>('INJECT_SCENE_GRAPH'),

    notifyUpdatedAppModel: createActionCreator('NOTIFY_UPDATED_APP_MODEL'),
    injectAppModel: createActionCreator<Model.App>('INJECT_APP_MODEL'),
  },

  toFullscreen: {
    switchTool: createActionCreator<Model.Tool>('UPDATE_TOOL'),
  }
};
