import colors from 'colors';
import glob from 'glob-promise';
import beautify from 'js-beautify';
import { Config } from './../../config/config';
import { BracketMatcher } from './../analysers/bracket-matcher';
import { DataRemover } from './../utils/data-remover';
import { Migrator } from "./migrator";

export class TestsMigrator extends Migrator {
  constructor(verbose = true) {
    super(verbose, '[TESTS MIGRATOR]');
  }

  async launch(): Promise<any> {
    await Promise.all([
      this.updateMainTest(),
      this.updateAngularJSON(),
      this.updateAngularJSSpecs(),
      this.updateKarmaConfig(),
      this.updatePolyfills()
    ])
  }

  /**
   * Update all module calls in AngularJS specs files by angular.mock.module
   *
   * @memberof TestsMigrator
   */
  private async updateAngularJSSpecs() {
    const files = await glob(`${Config.srcFolder}/**/*.spec.js`);
    const exp = new RegExp(this.getSpecsInclusionExp());
    const specs = files.filter(file => file.match(exp));

    const list = this.explanationGenerator.create('unordered-list', 'Update AngularJS spec files', 4);

    this.doneExplanations.insert(list);

    for (const spec of specs) {
      this.updateAngularJSSpec(spec);
      list.insert(
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Replace ',
            { type: 'inline-code', content: 'module(' },
            ' by ',
            { type: 'inline-code', content: 'angular.mock.module(' },
            ' in ',
            { type: 'inline-code', content: spec }
          )
        )
      )
    }
  }

  /**
   * Update all module calls in file files by angular.mock.module
   *
   * @private
   * @param {string} path Spec file path
   * @memberof TestsMigrator
   */
  private async updateAngularJSSpec(path: string) {
    let content = (await this.readFile(path)).toString();
    const matches = content.match(/[^.]module\(/g) || [];

    for (const match of matches) {
      content = content.replace(match, `${match.charAt(0)}angular.mock.module(`)
    }

    this.updateFile(path, content);
  }

  private generateSpecFile(path: string) {

  }

  /**
   * Update test.ts
   *
   * @private
   * @memberof TestsMigrator
   */
  private async updateMainTest() {
    const filePath = `${Config.srcFolder}/test.ts`;
    const test = (await this.readFile(filePath)).toString();
    const replacer = this.getSpecsInclusionExp();

    let expToReplace = /, \/.*?\/\)/;
    const match = test.match(expToReplace);
    if (!match) return;

    let stringToReplace = match[0].substring(1, match[0].length - 1).trim();

    let content = test.replace(stringToReplace, `/${replacer}/`);

    this.doneExplanations.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace ',
          { type: 'inline-code', content: stringToReplace },
          ' by ',
          { type: 'inline-code', content: replacer },
          ' in ',
          { type: 'inline-code', content: filePath }
        )
      )
    )

    this.updateFile(filePath, content);
  }

  /**
   * Generate regexp string for spec files inclusion
   *
   * @private
   * @returns {string} RegExp string
   * @memberof TestsMigrator
   */
  private getSpecsInclusionExp(): string {
    let foldersToInclude = '';
    const specsFolders = Config.tests.specsFolders;
    specsFolders.forEach((value, index) => {
      foldersToInclude += value.replace(/\//g, '\\/');
      if (index < specsFolders.length - 1) {
        foldersToInclude += '|'
      }
    })

    let replacer = foldersToInclude ? `(${foldersToInclude}).*\\.spec\\..s$` : '\\.spec\\..s$';

    return replacer;
  }

  /**
   * Add test related files to angular.json
   *
   * @private
   * @memberof TestsMigrator
   */
  private async updateAngularJSON() {
    let filesToIncludes: string[] = [];
    for (const file of Config.tests.testFilesToInclude) {
      let updatedFile = file.indexOf(Config.projectFolder) !== -1 ? file : `${Config.projectFolder}/${file}`;

      filesToIncludes = [
        ...filesToIncludes,
        ...await glob(updatedFile)
      ]
    }

    filesToIncludes = filesToIncludes.map(el => el.replace(`${Config.projectFolder}/`, ''));

    const angularJsonPath = `${Config.projectFolder}/angular.json`;

    let angular = JSON.parse(
      (await this.readFile(angularJsonPath)).toString()
    )

    let testsScripts = angular
      .projects[Config.projectName]
      .architect
      .test
      .options
      .scripts;

    angular
      .projects[Config.projectName]
      .architect
      .test
      .options
      .scripts = [
        ...testsScripts,
        ...filesToIncludes
      ];

    const list = this.explanationGenerator.create('unordered-list',
      this.explanationGenerator.buildMarkdown(
        'Update ',
        { type: 'inline-code', content: angularJsonPath },
        ' scripts for test'
      ),
      4
    )

    this.doneExplanations.insert(list);

    for (const file of filesToIncludes) {
      list.insert(
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Insert ',
            { type: 'inline-code', content: file }
          )
        )
      )
    }

    this.updateFile(
      angularJsonPath,
      JSON.stringify(angular, null, 2)
    );
  }

  /**
   * Update karma.conf.js
   *
   * @private
   * @memberof TestsMigrator
   */
  private async updateKarmaConfig() {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();

    const filePath = `${Config.projectFolder}/${Config.karmaConfig}`
    let karmaFileContent = '';
    try {
      karmaFileContent = (await this.readFile(filePath)).toString();
    } catch (e) {
      this.log(e, colors.red);
      return;
    }

    const configMatch = karmaFileContent.match(/config.set\(\s*{/);
    if (!configMatch) return;

    const bracketIndex = configMatch.index! + configMatch[0].indexOf('{');
    const lastBracketIndex = matcher.match(karmaFileContent, '{', bracketIndex);

    let configText = karmaFileContent
      .substring(bracketIndex, lastBracketIndex + 1)
      .replace(/'/g, '"');

    configText = remover.removeJSComments(configText);

    const propertiesExp = /(\w|'|").*:/g;

    const propertiesMatch = configText.match(propertiesExp) || [];

    for (const match of propertiesMatch) {
      if (match.charAt(0) !== "'" && match.charAt(0) !== '"') {
        let property = match.substring(0, match.length - 1);
        configText = configText.replace(match, `"${property}":`)
      }
    }

    const list = this.explanationGenerator.create('unordered-list',
      this.explanationGenerator.buildMarkdown(
        'Update ',
        { type: 'inline-code', content: filePath }
      ),
      4
    )

    this.doneExplanations.insert(list);

    let config = JSON.parse(configText);

    config.files = config.files
      // Remove angular mock inclusion
      .filter((el: any) => {
        if (typeof el === 'string') {
          if (el.indexOf('angular-mock') !== -1) {
            list.insert(
              this.explanationGenerator.create('chip',
                this.explanationGenerator.buildMarkdown(
                  'Remove ',
                  { type: 'inline-code', content: el }
                )
              )
            )
          }
          return el.indexOf('angular-mock') === -1;
        }
        return true;
      })
      // Remove spec files inclusion
      .map((el: any) => {
        if (typeof el === 'string' && el.indexOf('*.js') !== -1) {
          const newEl = el.replace('*.js', '!(*.spec).js');
          list.insert(
            this.explanationGenerator.create('chip',
              this.explanationGenerator.buildMarkdown(
                'Replace ',
                { type: 'inline-code', content: el },
                ' by ',
                { type: 'inline-code', content: newEl }
              )
            )
          )
          return newEl;
        }
        return el;
      })

    config.frameworks.push('@angular-devkit/build-angular');

    list.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Add ',
          { type: 'inline-code', content: '@angular-devkit/build-angular' },
          ' to frameworks'
        )
      )
    )

    config.plugins.push('@angular-devkit/build-angular/plugins/karma');

    list.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Add ',
          { type: 'inline-code', content: '@angular-devkit/build-angular/plugins/karma' },
          ' to plugins'
        )
      )
    )

    let newContent = karmaFileContent.substring(0, bracketIndex) + JSON.stringify(config, null, 2) + karmaFileContent.substring(lastBracketIndex + 1);

    newContent = newContent.replace(/src\/report/g, './report');

    list.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace all ',
          { type: 'inline-code', content: 'src/report' },
          ' by ',
          { type: 'inline-code', content: './report' }
        )
      )
    )

    newContent = beautify(newContent);

    this.updateFile(filePath, newContent)
  }

  /**
   * Update polyfills.ts
   *
   * @private
   * @memberof TestsMigrator
   */
  private async updatePolyfills() {
    const filePath = `${Config.srcFolder}/polyfills.ts`;
    let content = (await this.readFile(filePath)).toString();

    const list = this.explanationGenerator.create('chip',
      this.explanationGenerator.buildMarkdown(
        'Update ',
        { type: 'inline-code', content: filePath }
      ),
      4
    )

    this.doneExplanations.insert(list);

    const exp = /\/\/.*?import.*?core-js.*es6.*;/g
    const matches = content.match(exp) || [];

    for (const match of matches) {
      const text = match.replace(/\/\//, '');
      content = content.replace(match, text.trim());
      list.insert(
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Uncomment ',
            { type: 'inline-code', content: match }
          )
        )
      )
    }

    this.updateFile(filePath, content);
  }

}
