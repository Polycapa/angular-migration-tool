import colors from 'colors';
import fs from 'fs-extra-promise';
import inquirer from 'inquirer';
import { File } from '../../files/models/file';
import { Fix } from './models/fix';
import { SimplifiedResults } from './models/simplified-results';
import { SimplifiedRuleFailure } from './models/simplified-rule-failure';

export abstract class Fixer {
  protected applyFix(content: string, fix: Fix): string {
    return content.substring(0, fix.start) + fix.text + content.substring(fix.start + fix.length);
  }

  protected readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFileAsync(path, 'utf8')
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  }

  abstract async fix(file: File): Promise<SimplifiedResults>;
  async fixAll(files: File[]): Promise<SimplifiedResults[]> {
    let results: SimplifiedResults[] = [];
    for (const file of files) {
      results.push(await this.fix(file));
    }
    return results;
  }

  async askForFix(failure: SimplifiedRuleFailure, fixes: Fix[]): Promise<Fix | undefined> {
    let chosenFix: Fix | undefined;
    const descriptions = [
      ...fixes.map(fix => fix.description || 'Fix'),
      'None'
    ];

    const answers: any = await inquirer.prompt([{
      type: 'list',
      name: 'fix',
      message: `[${failure.fileName}] (${failure.startPosition.line}, ${failure.startPosition.character}) ${failure.failure}`,
      choices: descriptions
    }]);
    if (answers.fix !== 'None') {
      const answerIndex = descriptions.findIndex(el => el === answers.fix);

      chosenFix = fixes[answerIndex];
    }
    return chosenFix;
  }

  static generateResultsOutput(results: SimplifiedResults): string {
    let output = '';

    for (const error of results.errors) {
      const severity = error.severity.toUpperCase();
      const line = error.startPosition.line;
      const character = error.startPosition.character;
      const ruleName = error.ruleName;
      const description = error.failure;
      const fileName = error.fileName;

      const s = `[${severity}] [${fileName}] (${line},${character}) ${ruleName} ${description}\n`;

      const color: colors.Color = severity === 'ERROR' ? colors.red : colors.yellow;
      output += color(s);
    }

    for (const fix of results.fixes) {
      const line = fix.startPosition.line;
      const character = fix.startPosition.character;
      const ruleName = fix.ruleName;
      const description = fix.failure;
      const fileName = fix.fileName;

      const s = `[FIXED] [${fileName}] (${line},${character}) ${ruleName} ${description}\n`;

      const color: colors.Color = colors.green;
      output += color(s);
    }

    return output;
  }
}
