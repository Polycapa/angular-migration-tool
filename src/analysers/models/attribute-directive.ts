import { Directive } from './directive';
import { Function } from './function';
import { Variable } from './variable';
export interface AttributeDirective extends Directive {
  properties: Variable[],
  injects: Variable[],
  functions: Function[]
}
