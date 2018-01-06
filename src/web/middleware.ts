import * as redux from 'redux'

import {actions} from './actions';
import {Editor} from "../fullscreen/editor";
import {Reducers} from "./reducers";

export interface MiddlewareAPI<S> {
  dispatch: redux.Dispatch<any>;
  getState(): S;
}
export interface Middleware<S> {
  <S>(api: MiddlewareAPI<S>): (next: redux.Dispatch<any>) => redux.Dispatch<any>;
}

export const forwardActionsToFullscreen = (editor: Editor): Middleware<Reducers.State> =>
  store => next => action => {
    if (actions.toFullscreen.switchTool.matches(action)) {
      editor.switchTool(action.payload)
      return next(action)
    }
    return next(action)
  }
