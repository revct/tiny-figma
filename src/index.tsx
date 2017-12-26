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
    position: Math.random(),
    children: ['frame0', 'frame1', 'frame2'],
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [50, -50]),
  },
  frame0: {
    guid: 'frame0',
    type: 'FRAME',
    resizeToFit: false,
    position: Math.random(),
    parent: 'root',
    children: [],
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [50, -50]),
    width: 50,
    height: 50
  },
  frame1: {
    guid: 'frame1',
    type: 'FRAME',
    resizeToFit: false,
    position: Math.random(),
    parent: 'root',
    children: [],
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [50, 25]),
    width: 50,
    height: 50
  },
  frame2: {
    guid: 'frame2',
    type: 'FRAME',
    resizeToFit: false,
    position: Math.random(),
    parent: 'root',
    children: [],
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [-25, -25]),
    width: 50,
    height: 50
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

store.dispatch(actions.toWeb.injectSceneGraph(sceneGraph.object()));
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
