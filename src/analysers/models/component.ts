import { Function } from "./function";
import { Variable } from './variable';

export interface Component {
  name: string,
  selector: string,
  templateUrl?: string,
  styleUrl?: string,
  inputs?: Variable[],
  properties?: Variable[],
  functions?: Function[],
  injections?: Variable[],
  todo: string
}
