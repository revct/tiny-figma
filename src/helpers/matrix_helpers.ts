
import {mat2d} from "gl-matrix";

export const invert = (m: mat2d): mat2d => {
  return mat2d.invert(mat2d.create(), m) as mat2d
}
