import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as redux from 'redux'
import * as ReactRedux from 'react-redux'
import * as Immutable from 'immutable'

import {PropertiesPanel} from './web/components/PropertiesPanel'
import {LayersRoot} from './web/components/LayersPanel'

import {Reducers} from './web/reducers'
import {Editor} from './fullscreen/editor'
import {asyncSleep} from "./helpers/async_helpers";
import {actions} from "./web/actions";
import {Model} from "./fullscreen/types";
import {mat2d, vec2} from "gl-matrix";
import {ToolRoot} from "./web/components/ToolPicker";
import {forwardActionsToFullscreen} from "./web/middleware";
import {observeObject, Observer} from "./helpers/observe_helpers";
import {SceneGraph} from "./fullscreen/scene";
import {randomColorPicker} from "./helpers/primitive_helpers";
import {AppModel} from './fullscreen/app_model';

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
    color: randomColorPicker(),
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [50, 0]),
    width: 100,
    height: 100
  },
  frame1: {
    guid: 'frame1',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'frame0',
    color: randomColorPicker(),
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [20, 20]),
    width: 50,
    height: 50
  },
  frame2: {
    guid: 'frame2',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'frame1',
    color: randomColorPicker(),
    relativeTransform: mat2d.fromTranslation(mat2d.create(), [10, 10]),
    width: 30,
    height: 30
  },
  frame3: {
    guid: 'frame3',
    type: 'FRAME',
    resizeToFit: false,
    parent: 'root',
    color: randomColorPicker(),
    relativeTransform: mat2d.translate(mat2d.create(), mat2d.rotate(mat2d.create(), mat2d.create(), 3.14 * 0.1), vec2.fromValues(-100, -50)),
    width: 50,
    height: 50
  }
})

const appModel: AppModel = new AppModel({
  page: 'root',
  currentTool: Model.Tool.DEFAULT,
  selection: Immutable.Set<string>()
})

////////////////////////////////////////////////////////////////////////////////////////////////////

const editor = new Editor(
  document.getElementById('canvas') as HTMLCanvasElement,
  sceneGraph,
  appModel
)

const store = redux.createStore<Reducers.State>(
  Reducers.reducer,
  redux.applyMiddleware(forwardActionsToFullscreen(editor))
)

editor.sendActionToWeb = store.dispatch

store.dispatch(actions.toWeb.injectSceneGraph({mutableDerived: sceneGraph.getDerivedData(), mutableScene: sceneGraph.getSceneData()}));
store.dispatch(actions.toWeb.injectAppModel(appModel.getModel()));

ReactDOM.render(
  <ReactRedux.Provider store={store}><LayersRoot/></ReactRedux.Provider>,
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
