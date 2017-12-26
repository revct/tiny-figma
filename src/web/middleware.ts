import * as redux from 'redux'

import {actions} from './actions';
import {Editor} from "../fullscreen/editor";
import {State} from "./reducers";
import {Action} from "../helpers/redux_helpers";

export interface MiddlewareAPI<S> {
  dispatch: redux.Dispatch<any>;
  getState(): S;
}
export interface Middleware<S> {
  <S>(api: MiddlewareAPI<S>): (next: redux.Dispatch<any>) => redux.Dispatch<any>;
}

export const sendToFullscreenMiddleware = (editor: Editor): Middleware<State> =>
  store => next => action => {
    if (actions.toFullscreen.updateTool.matches(action)) {
      return next(action)
    }
    return next(action)
  }
