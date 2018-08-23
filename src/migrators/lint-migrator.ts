import { Path } from '../files/models/path';
import { Fixer } from '../utils/lint/fixer';
import { SimplifiedRuleFailure } from '../utils/lint/models/simplified-rule-failure';
import { TSFixer } from '../utils/lint/tsfixer';
import { Config } from './../../config/config';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { SimplifiedResults } from './../utils/lint/models/simplified-results';
import { TSLinter } from './../utils/lint/tslinter';
import { Migrator } from "./migrator";

export class LintMigrator extends Migrator {

  private async lintAll(files: File[]): Promise<any> {
    this.log('Analysing lint issues');
    const tslinter = new TSLinter();
    const lintResults = await tslinter.fixAll(files);
    this.log('Analysing TypeScript issues');
    const tsfixer = new TSFixer();
    const fixResults: SimplifiedResults[] = await tsfixer.fixAll(files);

    const results: SimplifiedResults[] = [
      ...lintResults,
      ...fixResults
    ].sort((a, b) => {
      if (a.fileName < b.fileName) {
        return -1;
      }
      if (b.fileName < a.fileName) {
        return 1;
      }
      return 0;
    }
    );

    if (Config.lint.output) {
      let log = '';
      for (const result of results) {
        log += Fixer.generateResultsOutput(result);
      }

      console.log(log);
    }

    if (Config.lint.logFile) {
      const stringResults = JSON.stringify(this.mergeResults(results), null, 2);
      this.createFile(Config.lint.logFile, stringResults);
    }
  }

  private mergeResults(results: SimplifiedResults[]): { [key: string]: { errors: SimplifiedRuleFailure[], fixes: SimplifiedRuleFailure[] } } {
    let mergedResults: { [key: string]: { errors: SimplifiedRuleFailure[], fixes: SimplifiedRuleFailure[] } } = {};
    for (const result of results) {
      if (!mergedResults[result.fileName]) {
        mergedResults[result.fileName] = {
          errors: [],
          fixes: []
        }
      }
      mergedResults[result.fileName].errors = [
        ...mergedResults[result.fileName].errors,
        ...result.errors
      ]

      mergedResults[result.fileName].fixes = [
        ...mergedResults[result.fileName].fixes,
        ...result.fixes
      ]
    }

    for (const key in mergedResults) {
      if (mergedResults.hasOwnProperty(key)) {
        const element = mergedResults[key];
        element.errors.sort((a, b) => {
          return b.startPosition.position - a.startPosition.position;
        })
        element.fixes.sort((a, b) => {
          return b.startPosition.position - a.startPosition.position;
        })
      }
    }

    return mergedResults;
  }

  constructor(verbose = true) {
    super(verbose, '[LINT MIGRATOR]');
  }

  async launch(): Promise<any> {
    const finder = new FilesFinder();
    let files: File[] = [];
    for (const path of Config.lint.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findTypeScript(path)
        ]
      }
    }
    await this.lintAll(files);
  }
}
