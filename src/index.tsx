import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as redux from 'redux'
import * as ReactRedux from 'react-redux'

import {PropertiesPanel} from './web/components/PropertiesPanel'
import {LayersPanel} from './web/components/LayersPanel'
import {Counter, ConnectedCounter} from './web/components/Counter'

import {State, reducer} from './web/reducers'
import {Editor} from './fullscreen/editor'
import {asyncSleep} from "./helpers/async_helpers";
import {SceneGraph} from "./fullscreen/scene_graph";
import {actionCreators} from "./web/actions";

const store = redux.createStore<State>(reducer)

ReactDOM.render(
  <ReactRedux.Provider store={store}><LayersPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('layers-panel-root'))

ReactDOM.render(
  <ReactRedux.Provider store={store}><PropertiesPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('properties-panel-root'))

const sceneGraph: SceneGraph = SceneGraph.create()

store.dispatch(actionCreators.injectSceneGraph(sceneGraph));

const editor = new Editor(document.getElementById('canvas') as HTMLCanvasElement)

;(async () => {
  const MILLIS = 1000.0 / 60.0
  while (true) {
    editor.think(MILLIS)
    editor.render()
    await asyncSleep(MILLIS)
  }
})()
