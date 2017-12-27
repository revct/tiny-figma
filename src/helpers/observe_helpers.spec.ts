
import * as assert from 'assert'
import {observeObject, Observer} from "./observe_helpers";

it('Proxy happens synchronously', () => {
  type X = {a?: number}

  let o = new Observer<X>();
  let x = observeObject<X>({}, o)

  let eventsReceived = 0

  o.addListener(e => {
    eventsReceived ++
  })

  assert.equal(eventsReceived, 0)
  x.a = 4
  assert.equal(eventsReceived, 1)
})