import * as React from "react"
import * as ReactDOM from "react-dom"
import * as redux from "redux"
import * as ReactRedux from "react-redux"

import {PropertiesPanel} from "./components/PropertiesPanel"
import {LayersPanel} from "./components/LayersPanel"
import {Counter, ConnectedCounter} from "./components/Counter"

import {State, reducer} from './redux/reducers'

const store = redux.createStore<State>(reducer)

ReactDOM.render(
  <ReactRedux.Provider store={store}><LayersPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById("layers-panel-root"))

ReactDOM.render(
  <ReactRedux.Provider store={store}><PropertiesPanel dispatch={a => a}/></ReactRedux.Provider>,
  document.getElementById("properties-panel-root"))

ReactDOM.render(
  <ReactRedux.Provider store={store}><ConnectedCounter /></ReactRedux.Provider>,
  document.getElementById("sandbox-root"))

document.getElementById("canvas-root")