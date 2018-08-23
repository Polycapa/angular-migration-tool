import fs from 'fs-extra-promise';
import ts from 'typescript';
import { File } from '../../files/models/file';
import { Config } from './../../../config/config';
import { Fixer } from "./fixer";
import { DiagnosticAndFixes } from './models/diagnostic-fixes';
import { Fix } from './models/fix';
import { Position } from './models/position';
import { SimplifiedResults } from "./models/simplified-results";
import { SimplifiedRuleFailure } from './models/simplified-rule-failure';
import { RuleFactory } from './rule-factory';
import { TSServer } from './tsserver';

export class TSFixer extends Fixer {
  private readonly server: TSServer;

  constructor() {
    super();
    this.server = new TSServer();
  }

  async fix(file: File): Promise<SimplifiedResults> {

    const serverResults = this.server.getDiagnosticsAndFixes(file.path.value);

    let failures = this.simplifyFailure(serverResults);

    const fixes = Config.lint.fix.enabled ? await this.fixesError(file.path.value, failures) : [];

    failures = failures.filter(el => fixes.indexOf(el) === -1);

    const simplifiedResults: SimplifiedResults = {
      fileName: file.path.filename,
      errors: failures,
      fixes: fixes
    };

    return simplifiedResults;
  }

  private simplifyFailure(items: DiagnosticAndFixes[] = []): SimplifiedRuleFailure[] {
    let failures: SimplifiedRuleFailure[] = [];
    for (const item of items) {
      let fixes: Fix[] = [];


      const start = item.diagnostic.start ? item.diagnostic.start : 0;
      const startLine = item.diagnostic.file!.getLineAndCharacterOfPosition(start).line;
      const startCharacter = item.diagnostic.file!.getLineAndCharacterOfPosition(start).character;

      const startPosition: Position = {
        position: start,
        line: startLine + 1,
        character: startCharacter + 1
      }

      const end = start + item.diagnostic.length!;
      const endLine = item.diagnostic.file!.getLineAndCharacterOfPosition(end).line;
      const endCharacter = item.diagnostic.file!.getLineAndCharacterOfPosition(end).character;

      const endPosition: Position = {
        position: end,
        line: endLine + 1,
        character: endCharacter + 1
      }

      let simplifiedFailure: SimplifiedRuleFailure = {
        endPosition: endPosition,
        failure: item.diagnostic.messageText.toString(),
        fileName: item.diagnostic.file!.fileName,
        fix: fixes,
        ruleName: item.diagnostic.code.toString(),
        severity: this.server.getDiagnosticType(item.diagnostic.category),
        startPosition: startPosition
      };

      const failureFixes = item.fixes;
      if (failureFixes.length) {
        for (const fix of failureFixes) {
          for (const change of fix.changes) {
            for (const textChange of change.textChanges) {
              let createdFix = this.createFix(simplifiedFailure, textChange);
              if (createdFix) {
                createdFix.description = fix.description;
                fixes.push(createdFix);
              }
            }
          }
        }
      } else {
        let createdFix = this.createFix(simplifiedFailure);
        if (createdFix) {
          createdFix.description = simplifiedFailure.failure;
          fixes.push(createdFix);
        }
      }

      simplifiedFailure.fix = fixes;

      failures.push(simplifiedFailure)
    }

    failures.sort((a, b) => a.startPosition.position - b.startPosition.position)
    return failures;
  }

  private createFix(failure: SimplifiedRuleFailure, fix?: ts.TextChange): Fix | undefined {
    let createdFix: Fix | undefined;
    if (fix) {
      createdFix = {
        fileName: failure.fileName,
        start: fix.span.start,
        length: fix.span.length,
        text: fix.newText
      }
    } else {
      const factory = new RuleFactory();
      const rule = factory.create(failure.ruleName);
      if (rule) {
        createdFix = rule.fix(failure);
      }
    }
    return createdFix;
  }

  private async fixesError(fileName: string, failures: SimplifiedRuleFailure[] = []) {
    let fixed: SimplifiedRuleFailure[] = [];
    let fileContents = '';
    try {
      fileContents = await this.readFile(fileName);
    } catch (error) {
      throw error;
    }

    let positionsToIgnore: Position[] = [];

    failures.sort((a, b) => b.endPosition.position - a.endPosition.position);

    for (const failure of failures) {
      if (positionsToIgnore
        .find(position => position.position === failure.startPosition.position)
      ) {
        continue;
      }
      if (failure.fix && Array.isArray(failure.fix) && failure.fix.length) {
        const fixes = failure.fix;

        const fix = Config.lint.fix.auto.fixer ? fixes[0] : await this.askForFix(failure, fixes);
        if (fix) {
          fileContents = this.applyFix(fileContents, fix);
          fixed.push(failure);
          positionsToIgnore.push(failure.startPosition);
        }
      }
    }

    fs.writeFileSync(fileName, fileContents);

    return fixed;
  }
}
