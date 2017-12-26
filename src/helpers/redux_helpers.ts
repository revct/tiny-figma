import * as redux from 'redux'
import {ActionCreator} from "./redux_helpers";

export interface HasDispatch {
  dispatch: redux.Dispatch<any>
}

export interface ActionCreator<TPayload> {
  // Returns an action with a non-empty payload
  (payload: TPayload): Action<TPayload>

  // Returns an action with an empty payload ({})
  (): Action<TPayload>

  // This function has a special return type that tells the Typescript
  // compiler whether `action` is of type `Action<TPayload>`. Suppose
  // we have an action type called `showModal` defined like so:
  //
  // const showModal = actionCreator<{ data: ShowModalData }>('SHOW_MODAL');
  //
  // Later, we might have a function that handles a generic action...
  //
  // function handleAction(action: Action<any>) {
  //   if (ShowModal.matches(action)) {
  //     // This throws a compile-time error because the Typescript
  //     // compiler knows that `action.payload` is of type
  //     // `{ data: ShowModalData }`
  //     console.log(action.monkey);
  //   }
  // }
  //
  // All code inside the if-block knows that `action` is of type
  // `Action<TPayload>`.
  matches(action: redux.Action): action is Action<TPayload>;
}

export interface Action<TPayload> extends redux.Action {
  payload: TPayload;
  error?: Error;
}

const usedActionTypes: { [key: string]: boolean } = Object.create(null);

export function generateUniqueActionType(type: string): string {
  let uniqueType = type;
  let suffix = 0;
  while (usedActionTypes[uniqueType]) {
    uniqueType = type + `_${suffix}`;
    suffix += 1;
  }

  usedActionTypes[uniqueType] = true;

  return uniqueType;
}

export function createActionCreator(type: string): ActionCreator<void>;
export function createActionCreator<TPayload>(type: string): ActionCreator<TPayload>;
export function createActionCreator(type: string) {
  const uniqueType = generateUniqueActionType(type);
  if (type !== uniqueType) {
    console.error(`
Hello!

The action type '${type}' is already used by another actionCreator, so
we renamed it to '${uniqueType}'.

There is likely a bug in your code!`);
  }

  const creator: any = (payload = {}) => {
    return { type: uniqueType, payload }
  }

  creator.matches = (action: Action<any>) => {
    return action.type === uniqueType;
  }

  return creator;
}

