import { SimplifiedRuleFailure } from './simplified-rule-failure';

export interface SimplifiedResults {
  fileName: string,
  errors: SimplifiedRuleFailure[],
  fixes: SimplifiedRuleFailure[]
}
