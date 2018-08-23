import { Variable } from './variable';

export interface Function {
  name: string,
  parameters?: Variable[],
  body: string,
  comment?: string
}
