import {actionCreators} from './actions';
import {Action} from '../helpers/redux_helpers';
import {combineReducers, Reducer} from 'redux'


export type State = {
  readonly counter: number,
}

const counter = (state: number = 0, action: Action<any>): number => {
  if (actionCreators.incrementCounter.matches(action)) {
    return state + 1
  }
  if (actionCreators.incrementCounterBy.matches(action)) {
    return state + action.payload.amount
  }
  return state
}

export const reducer: Reducer<State> = combineReducers({
  counter
});


