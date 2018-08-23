import { Fix } from './fix';
import { Position } from './position';

export interface SimplifiedRuleFailure {
  endPosition: Position,
  failure: string,
  fileName: string,
  fix: Fix | Fix[] | undefined,
  ruleName: string,
  severity: string,
  startPosition: Position
};
