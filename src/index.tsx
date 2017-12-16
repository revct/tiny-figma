import * as React from "react"
import * as ReactDOM from "react-dom"

import {PropertiesPanel} from "./components/PropertiesPanel"
import {LayersPanel} from "./components/LayersPanel"

ReactDOM.render(
  <LayersPanel />,
  document.getElementById("layers-panel-root"))

ReactDOM.render(
  <PropertiesPanel />,
  document.getElementById("properties-panel-root"))

document.getElementById("canvas-root")