import fs from 'fs-extra-promise';
import { GeneratedContent } from '../explainer/models/generated-content';
import { Logger } from '../utils/logger';
import { ExplanationGenerator } from './../explainer/explanation-generator';
import colors = require('colors');

export abstract class Migrator extends Logger {
  protected verbose: boolean;
  protected explanations: GeneratedContent;
  protected todoExplanations: GeneratedContent;
  protected doneExplanations: GeneratedContent;
  protected explanationGenerator = ExplanationGenerator.instance;

  constructor(verbose = true, tag: string = '[MIGRATOR]', printColor = colors.white) {
    super(tag, printColor);
    this.verbose = verbose;

    this.explanations = this.explanationGenerator.add('title', tag, 1)!;

    const todo = this.explanationGenerator.create('title', 'TODO', 2)!;
    this.todoExplanations = this.explanationGenerator.create('unordered-list')!;
    todo.insert(this.todoExplanations);

    const done = this.explanationGenerator.create('title', 'DONE', 2)!;
    this.doneExplanations = this.explanationGenerator.create('unordered-list')!;
    done.insert(this.doneExplanations);

    this.explanationGenerator.insertIn(this.explanations, done, todo)
  }

  abstract async launch(): Promise<any>;

  protected createLog(title: string, code: string): string {
    return `
${`***** ${title} *****`.green}
${code}`;
  }

  protected createFile(path: string, content: string) {
    return new Promise((resolve, reject) => {
      fs.writeFileAsync(path, content)
        .then(_ => {
          if (this.verbose) this.log(`${path} created`, colors.green)
          resolve();
        })
        .catch(err => {
          reject(err);
        })
    });
  }

  protected updateFile(path: string, content: string) {
    return new Promise((resolve, reject) => {
      fs.writeFileAsync(path, content)
        .then(_ => {
          if (this.verbose) this.log(`${path} updated`, colors.magenta)
          resolve();
        })
        .catch(err => {
          reject(err);
        })
    });
  }

  protected readFile(path: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fs.readFileAsync(path)
        .then(data => resolve(data))
        .catch(err => reject(err));
    });
  }
}
