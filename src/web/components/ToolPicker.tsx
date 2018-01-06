import * as React from "react"
import {HasDispatch} from "../../helpers/redux_helpers";
import {Reducers} from "../reducers";
import {connect} from "react-redux";
import {actions} from "../actions";
import {Model} from "../../fullscreen/types";

export const ToolPicker = (props: {currentTool: Model.Tool} & HasDispatch) => {
  return <div>
    <span
      className={`clickable-icon ${props.currentTool === Model.Tool.DEFAULT ? 'selected' : ''}`}
      onClick={() => props.dispatch(actions.toFullscreen.switchTool(Model.Tool.DEFAULT))}
    >☝</span>
    <span
      className={`clickable-icon ${props.currentTool === Model.Tool.FRAME ? 'selected' : ''}`}
      onClick={() => props.dispatch(actions.toFullscreen.switchTool(Model.Tool.FRAME))}
    >🖼</span>
  </div>
}

export const ToolRoot = connect(
  s => { return {state: s} },
)(
  (props: {state: Reducers.State} & HasDispatch) =>
    <ToolPicker currentTool={props.state.appModel.mutable.currentTool} dispatch={props.dispatch}/>
)