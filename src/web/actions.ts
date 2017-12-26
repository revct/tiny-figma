import {createActionCreator} from '../helpers/redux_helpers'
import {MutableSceneGraph} from "./reducers";
import {Fullscreen} from "../fullscreen/types";
import AppModel = Fullscreen.AppModel;
import Tool = Fullscreen.Tool;

export interface UpdateMirrorPayload {
  appModel?: AppModel
}

// Action Creators
export const actions = {
  toWeb: {
    // In Figma, action.fullscreen.updateMirror handles updates to the scene graph by packaging
    // a series of node changes which update mutableNodes in the redux state.
    notifyUpdatedSceneGraph: createActionCreator('NOTIFY_UPDATED_SCENE_GRAPH'),
    injectSceneGraph: createActionCreator<MutableSceneGraph>('INJECT_SCENE_GRAPH'),

    updateMirror: createActionCreator<UpdateMirrorPayload>('UPDATE_APP_MODEL'),
  },

  toFullscreen: {
    updateTool: createActionCreator<Tool>('UPDATE_TOOL'),
  }
};
