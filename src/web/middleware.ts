import * as redux from 'redux'

import {actions} from './actions';
import {Editor} from "../fullscreen/editor";
import {State} from "./reducers";
import {Action} from "../helpers/redux_helpers";



export interface Dispatch<S> {
  <A extends redux.Action> (action: A): A;
}
export interface MiddlewareAPI<S> {
  dispatch: Dispatch<S>;
  getState(): S;
}
export interface Middleware<S> {
  <S>(api: MiddlewareAPI<S>): (next: Dispatch<S>) => Dispatch<S>;
}

export const sendToFullscreenMiddleware = (editor: Editor): Middleware<State> =>
  store => next => action => {
    // store = store as Middleware<State, Action<any>
    if (actions.toFullscreen.updateTool.matches(action)) {
      return next(action)
    }
    return next(action)
  }
