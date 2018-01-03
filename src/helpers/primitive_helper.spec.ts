
describe('readonly', () => {
  let obj: Readonly<{x: number, y: {z: number}}> = {x: 1, y: {z: 2}}

  // obj.x += 1 ERROR
  // obj.y = {z: 3} ERROR

  obj.y.z += 1 // NO ERROR
  obj = {x: 3, y: {z: 4}} // NO ERROR
})
