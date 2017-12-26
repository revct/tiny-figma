import {createActionCreator} from '../helpers/redux_helpers'
import {Fullscreen} from "../fullscreen/types";
import AppModel = Fullscreen.AppModel;
import Tool = Fullscreen.Tool;
import SceneGraph = Fullscreen.SceneGraph;

// Action Creators
export const actions = {
  toWeb: {
    // In Figma, action.fullscreen.updateMirror handles updates to the scene graph by packaging
    // a series of node changes which update mutableNodes in the redux state.
    notifyUpdatedSceneGraph: createActionCreator('NOTIFY_UPDATED_SCENE_GRAPH'),
    injectSceneGraph: createActionCreator<SceneGraph>('INJECT_SCENE_GRAPH'),

    notifyUpdatedAppModel: createActionCreator('NOTIFY_UPDATED_APP_MODEL'),
    injectAppModel: createActionCreator<AppModel>('INJECT_APP_MODEL'),
  },

  toFullscreen: {
    switchTool: createActionCreator<Tool>('UPDATE_TOOL'),
  }
};
