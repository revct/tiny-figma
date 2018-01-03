import {Map, Set} from "immutable";

declare module "immutable" {
  interface Map<K, V> {
    [Symbol.iterator](): IterableIterator<[K,V]>;
  }
  interface Set<T> {
    [Symbol.iterator](): IterableIterator<T>;
  }
}
