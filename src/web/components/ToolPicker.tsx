import * as React from "react"
import {HasDispatch} from "../../helpers/redux_helpers";
import {State} from "../reducers";
import {connect} from "react-redux";
import {actions} from "../actions";
import {Fullscreen} from "../../fullscreen/types";
import Tool = Fullscreen.Tool;

export const ToolPicker = (props: {currentTool: Tool} & HasDispatch) => {
  return <div>
    <span
      className={`clickable-icon ${props.currentTool === Tool.DEFAULT ? 'selected' : ''}`}
      onClick={() => props.dispatch(actions.toFullscreen.updateTool(Tool.DEFAULT))}
    >☝</span>
    <span
      className={`clickable-icon ${props.currentTool === Tool.FRAME ? 'selected' : ''}`}
      onClick={() => props.dispatch(actions.toFullscreen.updateTool(Tool.FRAME))}
    >🖼</span>
  </div>
}

export const ToolRoot = connect(
  s => { return {state: s} },
)(
  (props: {state: State} & HasDispatch) =>
    <ToolPicker currentTool={props.state.appModel.currentTool} dispatch={props.dispatch}/>
)