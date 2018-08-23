import { Function } from "./function";
import { Variable } from './variable';

export interface Injectable {
  name: string,
  properties: Variable[],
  functions: Function[],
  injections: Variable[],
  todo: string
}
