import * as React from "react"
import {HasDispatch} from "../helpers/redux_helpers";
import {State} from "../redux/reducers";
import {connect} from "react-redux";
import {actionCreators} from "../redux/actions";

export interface CounterProps extends HasDispatch, State {
}

export const Counter = (props: CounterProps) => <div>
  <h3>{props.counter}</h3>
  <button onClick={() => props.dispatch(actionCreators.incrementCounter())}>Increment</button>
</div>

export const ConnectedCounter = connect((s: State) => s)(Counter)

