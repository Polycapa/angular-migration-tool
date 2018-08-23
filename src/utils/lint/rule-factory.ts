import { LintRule } from './models/lint-rule';
import { ImplicitAnyRule } from './rules/ImplicitAnyRule';
import { TripleEqualsRule } from './rules/TripleEqualsRule';

export class RuleFactory {
  create(name: string): LintRule | undefined {
    switch (name) {
      case 'triple-equals':
        return new TripleEqualsRule();
      case '7006':
        return new ImplicitAnyRule();
      default:
        return;
    }
  }

}
