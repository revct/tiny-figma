import * as React from "react"
import {HasDispatch} from "../../helpers/redux_helpers";
import {Reducers} from "../reducers";
import {Model} from "../../fullscreen/types";
import {connect} from "react-redux";

export interface LayersPanelProps extends HasDispatch {
  sceneGraph: Reducers.SceneGraph
  appModel: Reducers.AppModel
}

const generateLayers = (sceneGraph: Reducers.SceneGraph, appModel: Reducers.AppModel) => {
  const rootNode: Model.Node = sceneGraph.mutableScene[appModel.mutable.page]
}

const LayersPanel = (props: LayersPanelProps) =>
  <div>
    Layers Panel
  </div>


export const LayersRoot = connect(
  s => { return {state: s} },
)(
  (props: {state: Reducers.State} & HasDispatch) =>
    <LayersPanel sceneGraph={props.state.sceneGraph} appModel={props.state.appModel} dispatch={props.dispatch}/>
)