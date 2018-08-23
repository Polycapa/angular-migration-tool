import { Fix } from '../models/fix';
import { SimplifiedRuleFailure } from '../models/simplified-rule-failure';
import { LintRule } from './../models/lint-rule';

export class ImplicitAnyRule implements LintRule {
  fix(failure: SimplifiedRuleFailure): Fix {
    let text = failure.failure.substring(failure.failure.indexOf("'") + 1);
    const parameter = text.substring(0, text.indexOf("'"));
    text = `${parameter}: any`;

    return {
      fileName: failure.fileName,
      description: `Add 'any' type to '${parameter}' parameter`,
      start: failure.startPosition.position,
      length: failure.endPosition.position - failure.startPosition.position,
      text: text
    }
  }
}
