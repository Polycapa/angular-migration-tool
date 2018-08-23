import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { UnitTest } from '../analysers/models/unit-test';
import { UnitTestBeforeEach } from '../analysers/models/unit-test-before-each';
import { UnitTestIt } from '../analysers/models/unit-test-it';
import { Config } from './../../config/config';
import { BracketMatcher } from './../analysers/bracket-matcher';
import { UnitTestDescribe } from './../analysers/models/unit-test-describe';
import { UnitTestXit } from './../analysers/models/unit-test-xit';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';

export class SpecGenerator {
  generate(componentName: string, test: UnitTestDescribe): Promise<string> {
    const remover = new DataRemover();
    const mainTitle = test.title;
    let body = '// ' + test.body
      .replace(/\n/g, '\n//')
      .replace(/\r/g, '\r//');

    const moduleName = componentName.replace('Component', 'Module');

    const key = componentName
      .replace('Component', '')
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .replace(/^-/, '');

    let mainContent = '';

    for (const child of test.children) {
      mainContent += this.getCode(child);
    }

    const samplePath = path.join(RootPath.path, './samples/component.spec.sample.ts');


    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath, 'utf-8')
        .then(content => {

          content = content
            .replace('$componentFile', `./${key}${Config.components.generatedPrefix}.component`)
            .replace('$moduleFile', `./${key}${Config.components.generatedPrefix}.module`)
            .replace(/\$component/g, componentName)
            .replace(/\$module/g, moduleName)
            .replace('$mainTitle', mainTitle)
            .replace('$body', body)
            .replace('$content', mainContent);

          content = this.geti18nCode(content);

          content = remover.removeEmptyLines(content);

          content = beautify(content);
          resolve(content);
        })
        .catch(err => reject(err));
    });
  }

  protected getCode(unit: UnitTest) {
    if (unit.isDescribe()) {
      return this.getDescribeCode(unit as UnitTestDescribe);
    } else if (unit.isBeforeEach()) {
      return '// ' + this.getBeforeEachCode(unit as UnitTestBeforeEach)
        .trim()
        .replace(/\n/g, '\n//')
        .replace(/\r/g, '\r//')
    } else if (unit.isIt()) {
      return this.getItCode(unit as UnitTestIt);
    } else if (unit.isXit()) {
      return this.getXitCode(unit as UnitTestXit);
    }
  }

  protected getDescribeCode(unit: UnitTestDescribe): string {
    let childrenCode = '';
    for (const child of unit.children) {
      childrenCode += this.getCode(child);
    }

    const body = '// ' + unit.body
      .replace(/\n/g, '\n//')
      .replace(/\r/g, '\r//');

    let code = `

    ${body}
    ${unit.comments ? unit.comments : '\n'}describe('${unit.title}', () => {
      ${childrenCode}
    })
    `;
    return code;
  }

  protected getBeforeEachCode(unit: UnitTestBeforeEach): string {
    let code = `
    ${unit.comments ? unit.comments : '\n'}beforeEach(${unit.body})`;

    return code;
  }

  protected getItCode(unit: UnitTestIt): string {
    let code = `

    ${unit.comments ? unit.comments : '\n'}it('${unit.title}', () => {
      ${this.updateBody(unit.body)}
    })
    `;
    return code;
  }

  protected getXitCode(unit: UnitTestXit): string {
    let code = `

    ${unit.comments ? unit.comments : '\n'}xit('${unit.title}', () => {
      ${this.updateBody(unit.body)}
    })
    `;
    return code;
  }

  protected updateBody(body: string): string {
    const remover = new DataRemover();

    let updated = body;

    // Remove $scope useless calls
    updated = updated
      .replace('$scope.$digest();', '')
      .replace(/.*?compile.*?(\n|\r)/, '');

    // Comment element part because it's replaced by compiled
    updated = updated.replace(
      /(var)?\s*element\s*=.*?(;|\n|\r)/g,
      match => `\n// ${match.trim()}`
    )

    // Replace $scope, directive and ctrl by component
    updated = updated.replace(/(\$scope|directive|ctrl|scope)/g, 'component');

    // Replace element by compiled
    updated = updated.replace(/element/g, 'compiled');

    // Replace component.find by compiled.querySelectorAll
    updated = updated.replace(/(component|element)\.find/g, 'compiled.querySelectorAll')

    // Replace toEqualData by toEqual as it doesn't exist now
    updated = updated.replace(/\.toEqualData/g, '.toEqual')

    updated = updated.replace(/^\s*dump.*;?/gm, match => `// ${match.trim()}`)

    updated = this.removeVarComponent(updated);

    updated = 'let compiled = fixture.nativeElement;\n' + updated;

    const firstExpectIndex = updated.indexOf('expect');

    if (firstExpectIndex !== -1) {
      updated = updated.substring(0, firstExpectIndex) + '\nfixture.detectChanges();\n' + updated.substring(firstExpectIndex);
    } else {
      updated += '\nfixture.detectChanges();\n';
    }

    updated = remover.removeEmptyLines(updated);

    return updated;
  }

  protected removeVarComponent(body: string): string {
    let updated = body;
    const matcher = new BracketMatcher();

    const exp = /^\s*var\s*component\s*.*?(\n.*?)*(;|{|\[);?/gm;
    const matches = body.match(exp) || [];

    for (const match of matches) {
      let toRemove: string;
      if (match.charAt(match.length - 1) === '{') {
        const matchIndex = body.indexOf(match);
        const index = matchIndex + match.length - 1;
        const lastIndex = matcher.match(body, '{', index);
        toRemove = body.substring(matchIndex, lastIndex + 1);
      } else if (match.charAt(match.length - 1) === '(') {
        const matchIndex = body.indexOf(match);
        const index = matchIndex + match.length - 1;
        const lastIndex = matcher.match(body, '(', index);
        toRemove = body.substring(matchIndex, lastIndex + 1);
      } else {
        toRemove = match;
      }

      updated = updated.replace(toRemove, '');
    }
    return updated;
  }

  protected geti18nCode(code: string): string {
    const i18nExp = new RegExp('\/\/ I18N((\n|\r).*?)*\/\/ END I18N', 'g');
    const i18nMatches = code.match(i18nExp) || [];
    for (const match of i18nMatches) {
      let updated = Config.i18n.generate ?
        match
          .replace('// I18N', '')
          .replace('// END I18N', '')
          .replace(/\/\/\s/g, '')
        : '';
      code = code.replace(match, updated);
    }

    return code;
  }
}
