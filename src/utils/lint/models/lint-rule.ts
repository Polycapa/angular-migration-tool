import { Fix } from './fix';
import { SimplifiedRuleFailure } from './simplified-rule-failure';

export interface LintRule {
  fix(failure: SimplifiedRuleFailure): Fix
}
