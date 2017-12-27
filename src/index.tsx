import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as redux from 'redux'
import * as ReactRedux from 'react-redux'

import {PropertiesPanel} from './web/components/PropertiesPanel'
import {LayersPanel} from './web/components/LayersPanel'

import {State, reducer} from './web/reducers'
import {Editor} from './fullscreen/editor'
import {asyncSleep} from "./helpers/async_helpers";
import {actions} from "./web/actions";
import {Model} from "./fullscreen/types";
import {mat2d} from "gl-matrix";
import {ToolRoot} from "./web/components/ToolPicker";
import {forwardActionsToFullscreen} from "./web/middleware";
import {observeObject, Observer} from "./helpers/observe_helpers";
import {SceneGraph} from "./fullscreen/scene";

const sceneGraph: SceneGraph = new SceneGraph({
  root: {
    guid: 'root',
    type: 'CANVAS',
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [0, 0]),
  },
  frame0: {
    guid: 'frame0',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'root',
    color: '#cfc',
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [50, 0]),
    width: 100,
    height: 100
  },
  frame1: {
    guid: 'frame1',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'frame0',
    color: '#fcc',
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [20, 20]),
    width: 50,
    height: 50
  },
  frame2: {
    guid: 'frame2',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'frame1',
    color: '#ccf',
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [10, 10]),
    width: 30,
    height: 30
  }
})

const appModelObserver: Observer<Model.App> = new Observer()
const appModel = observeObject<Model.App>({
  page: 'root',
  currentTool: Model.Tool.DEFAULT
}, appModelObserver)

////////////////////////////////////////////////////////////////////////////////////////////////////

const editor = new Editor(
  document.getElementById('canvas') as HTMLCanvasElement,
  sceneGraph,
  appModel
)

const store = redux.createStore<State>(
  reducer,
  redux.applyMiddleware(forwardActionsToFullscreen(editor))
)

appModelObserver.addListener(c => editor.onAppModelChange(c))
editor.sendActionToWeb = store.dispatch

store.dispatch(actions.toWeb.injectSceneGraph(sceneGraph.getModel()));
store.dispatch(actions.toWeb.injectAppModel(appModel));

ReactDOM.render(
  <ReactRedux.Provider store={store}><LayersPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('layers-panel-root'))

ReactDOM.render(
  <ReactRedux.Provider store={store}><PropertiesPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('properties-panel-root'))

ReactDOM.render(
  <ReactRedux.Provider store={store}><ToolRoot/></ReactRedux.Provider>,
  document.getElementById('tools-root'))

////////////////////////////////////////////////////////////////////////////////////////////////////

;(async () => {
  const MILLIS = 1000.0 / 60.0
  while (true) {
    editor.think(MILLIS)
    editor.render()
    await asyncSleep(MILLIS)
  }
})()
