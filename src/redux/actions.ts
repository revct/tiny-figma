import {createActionCreator} from '../helpers/redux_helpers'

// Action Creators
export const actionCreators = {
  incrementCounter: createActionCreator('INCREMENT_COUNTER'),
  incrementCounterBy: createActionCreator<{ amount: number } >('INCREMENT_COUNTER_BY'),
};

/*
dispatch(actionCreators.incrementCounter(4)); // Error: Expected 0 arguments, but got 1.
dispatch(actionCreators.incrementCounter()); // OK: { type: "INCREMENT_COUNTER" }
actionCreators.incrementCounter.type === "INCREMENT_COUNTER" // true
*/
