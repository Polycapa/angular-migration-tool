import { Fix } from '../models/fix';
import { LintRule } from './../models/lint-rule';
import { SimplifiedRuleFailure } from './../models/simplified-rule-failure';

export class TripleEqualsRule implements LintRule {
  fix(failure: SimplifiedRuleFailure): Fix {
    const text = failure.failure.indexOf('!=') !== -1 ? '!==' : '===';
    return {
      fileName: failure.fileName,
      start: failure.startPosition.position,
      length: failure.endPosition.position - failure.startPosition.position,
      text: text
    }
  }
}
