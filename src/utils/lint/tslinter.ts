import fs from 'fs-extra-promise';
import path from 'path';
import { Configuration, ILinterOptions, Linter, Replacement, RuleFailure } from "tslint";
import ts from 'typescript';
import { File } from '../../files/models/file';
import { Config } from './../../../config/config';
import { RootPath } from './../root-path';
import { Fixer } from './fixer';
import { Fix } from './models/fix';
import { Position } from './models/position';
import { SimplifiedResults } from './models/simplified-results';
import { SimplifiedRuleFailure } from './models/simplified-rule-failure';
import { RuleFactory } from './rule-factory';

export class TSLinter extends Fixer {
  private readonly configFilename = path.join(RootPath.path, './config/tslint.json');
  private readonly linter: Linter;
  private readonly program: ts.Program;
  private readonly tsconfigPath = path.join(Config.projectFolder, "./tsconfig.json");
  private readonly options: ILinterOptions = {
    fix: false,
    formatter: "json"
  };

  constructor() {
    super();
    this.program = Linter.createProgram(this.tsconfigPath);
    this.linter = new Linter(this.options, this.program);
  }

  async fix(file: File): Promise<SimplifiedResults> {
    const configuration = Configuration.findConfiguration(this.configFilename, file.path.value).results;
    let fileContents = '';
    try {
      fileContents = file.content;
    } catch (e) {
      throw e;
    }

    // Lint file
    this.linter.lint(file.path.value, fileContents, configuration);
    const result = this.linter.getResult();

    // Get failures
    let failures: SimplifiedRuleFailure[] = this.simplifyFailure(result.failures);

    // Fix failures that are not automatically fixed and have a fix
    const fixedFailures = Config.lint.fix.enabled ? await this.fixesError(file.path.value, failures) : [];

    if (Config.lint.fix.enabled) {
      // Remove fixed failures
      failures = failures.filter(el => !el.fix);
    }

    // Get automatically fixed failures and failures fixed above
    const fixes: SimplifiedRuleFailure[] =
      [
        ...this.simplifyFailure(result.fixes),
        ...fixedFailures
      ];

    const simplifiedResults: SimplifiedResults = {
      fileName: file.path.filename,
      errors: failures,
      fixes: fixes
    };

    return simplifiedResults;
  }

  private simplifyFailure(items: RuleFailure[] = []): SimplifiedRuleFailure[] {
    let failures: SimplifiedRuleFailure[] = [];
    for (const failure of items) {
      let fixes: Fix[] | Fix | undefined;

      const endPosition: Position = {
        position: failure.getEndPosition().getPosition(),
        line: failure.getEndPosition().getLineAndCharacter().line,
        character: failure.getEndPosition().getLineAndCharacter().character
      }

      const startPosition: Position = {
        position: failure.getStartPosition().getPosition(),
        line: failure.getStartPosition().getLineAndCharacter().line,
        character: failure.getStartPosition().getLineAndCharacter().character
      }

      let simplifiedFailure: SimplifiedRuleFailure = {
        endPosition: endPosition,
        failure: failure.getFailure(),
        fileName: failure.getFileName(),
        fix: fixes,
        ruleName: failure.getRuleName(),
        severity: failure.getRuleSeverity(),
        startPosition: startPosition
      };

      const failureFixes = failure.getFix();
      if (failureFixes && Array.isArray(failureFixes)) {
        fixes = [];
        for (const failureFix of failureFixes) {
          const fix = this.createFix(simplifiedFailure, failureFix);
          if (fix) {
            fixes.push(fix);
          }
        }
      } else {
        fixes = this.createFix(simplifiedFailure, failureFixes);
      }

      simplifiedFailure.fix = fixes;

      failures.push(simplifiedFailure)
    }

    failures.sort((a, b) => a.startPosition.position - b.startPosition.position)
    return failures;
  }

  private async fixesError(fileName: string, failures: SimplifiedRuleFailure[] = []): Promise<SimplifiedRuleFailure[]> {
    let fixed: SimplifiedRuleFailure[] = [];
    let fileContents = '';
    try {
      fileContents = await this.readFile(fileName);
    } catch (error) {
      throw error;
    }

    let positionsToIgnore: Position[] = [];
    // Invert so that diffs are properly applied
    failures.sort((a, b) => b.endPosition.position - a.endPosition.position)

    for (const failure of failures) {
      if (positionsToIgnore
        .find(position => position.position === failure.startPosition.position)
      ) {
        continue;
      }
      if (failure.fix && Array.isArray(failure.fix)) {
        // If auto is false and user want to apply fix for this failure, all the fixes need to be applied (and not only one)
        const fix = Config.lint.fix.auto.linter ? failure.fix[0] : await this.askForFix(failure, [failure.fix[0]]);
        if (fix) {
          for (const temp of failure.fix.sort((a, b) => b.start - a.start)) {
            fileContents = this.applyFix(fileContents, temp);
          }
          fixed.push(failure);
          positionsToIgnore.push(failure.startPosition);
        }
      } else if (failure.fix) {
        const fix = Config.lint.fix.auto.linter ? failure.fix : await this.askForFix(failure, [failure.fix]);
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

  private createFix(failure: SimplifiedRuleFailure, fix?: Replacement): Fix | undefined {
    let createdFix: Fix | undefined;
    if (fix) {
      createdFix = {
        fileName: failure.fileName,
        start: fix.start,
        length: fix.length,
        text: fix.text
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
}
