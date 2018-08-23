import { Variable } from './variable';
export interface Filter {
  name: string,
  params: Variable[],
  body: string,
  injections: Variable[]
}
