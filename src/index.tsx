import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as redux from 'redux'
import * as ReactRedux from 'react-redux'

import {PropertiesPanel} from './components/PropertiesPanel'
import {LayersPanel} from './components/LayersPanel'
import {Counter, ConnectedCounter} from './components/Counter'

import {State, reducer} from './redux/reducers'
import {Editor} from './editor/editor'
import {asyncSleep} from "./helpers/async_helpers";

const store = redux.createStore<State>(reducer)

ReactDOM.render(
  <ReactRedux.Provider store={store}><LayersPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('layers-panel-root'))

ReactDOM.render(
  <ReactRedux.Provider store={store}><PropertiesPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById('properties-panel-root'))

const editor = new Editor(document.getElementById('canvas') as HTMLCanvasElement)

;(async () => {
  const MILLIS = 1000.0 / 60.0
  while (true) {
    editor.think(MILLIS)
    editor.render()
    await asyncSleep(MILLIS)
  }
})()
