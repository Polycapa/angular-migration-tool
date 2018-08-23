import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { UnitTest } from '../analysers/models/unit-test';
import { UnitTestBeforeEach } from '../analysers/models/unit-test-before-each';
import { UnitTestIt } from '../analysers/models/unit-test-it';
import { Config } from './../../config/config';
import { UnitTestDescribe } from './../analysers/models/unit-test-describe';
import { UnitTestXit } from './../analysers/models/unit-test-xit';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';

export class PipeSpecGenerator {
  generate(test: UnitTestDescribe): Promise<string> {
    const remover = new DataRemover();
    const mainTitle = test.title;
    let body = '// ' + test.body
      .replace(/\n/g, '\n//')
      .replace(/\r/g, '\r//');

    let mainContent = '';

    for (const child of test.children) {
      mainContent += this.getCode(child);
    }

    const imports = this.getFiltersImports(mainContent);

    const samplePath = path.join(RootPath.path, './samples/pipe.spec.sample.ts');


    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath, 'utf-8')
        .then(content => {

          content = content
            .replace('$imports', imports)
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

  private getCode(unit: UnitTest) {
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

  private getDescribeCode(unit: UnitTestDescribe): string {
    let childrenCode = '';
    for (const child of unit.children) {
      childrenCode += this.getCode(child);
    }

    const body = '// ' + unit.body
      .replace(/\n/g, '\n//')
      .replace(/\r/g, '\r//');

    let code = `

    ${unit.comments}describe('${unit.title}', () => {
      ${body}

      ${childrenCode}
    })
    `;
    return code;
  }

  private getBeforeEachCode(unit: UnitTestBeforeEach): string {
    let code = `

    ${unit.comments}beforeEach(${unit.body})
    `;
    return code;
  }

  private getItCode(unit: UnitTestIt): string {
    let code = `

    ${unit.comments}it('${unit.title}', () => {
      ${this.updateBody(unit.body)}
    })
    `;
    return code;
  }

  private getXitCode(unit: UnitTestXit): string {
    let code = `

    ${unit.comments}xit('${unit.title}', () => {
      ${this.updateBody(unit.body)}
    })
    `;
    return code;
  }

  private updateBody(body: string): string {
    const remover = new DataRemover();

    let updated = body;

    updated = updated.replace(/^\s*dump.*;?/gm, match => `// ${match.trim()}`)

    updated = this.getFiltersVar(updated) + updated;

    updated = this.updateFilters(updated);

    updated = remover.removeEmptyLines(updated);


    return updated;
  }

  private getFiltersImports(body: string): string {
    const exp = /let.*?Pipe\(\)/g;
    let filters: string[] = [];

    const matches = body.match(exp) || [];

    for (const match of matches) {
      let name = match
        .split('=')[0]
        .replace(/let/g, '')
        .trim();

      if (filters.findIndex(el => el === name) === -1) {
        filters.push(name);
      }
    }

    let code = '';

    for (const filter of filters) {
      const key = filter
        .replace(/^[A-Z]/, letter => letter.toLowerCase())
        .replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

      const className = filter.charAt(0).toUpperCase() + filter.substring(1) + 'Pipe';

      code += `import { ${className} } from './${key}.pipe';\n`;
    }

    return code;
  }

  private getFiltersVar(body: string): string {
    const exp = /\$?filter\(.*?\)/g;
    let filters: string[] = [];

    const matches = body.match(exp) || [];

    for (const match of matches) {
      let name = match
        .substring(
          match.indexOf('(') + 1,
          match.indexOf(')')
        )
        .replace(/('|")/g, '');

      if (filters.findIndex(el => el === name) === -1) {
        filters.push(name);
      }
    }

    let code = '';

    for (const filter of filters) {
      let className = filter.charAt(0).toUpperCase() + filter.substring(1) + 'Pipe';

      code += `let ${filter} = new ${className}()\n`;
    }

    return code;
  }

  private updateFilters(body: string): string {
    const exp = /\$?filter\(.*?\)/g;
    const matches = body.match(exp) || [];

    for (const match of matches) {
      let name = match
        .substring(
          match.indexOf('(') + 1,
          match.indexOf(')')
        )
        .replace(/('|")/g, '');

      body = body.replace(match, `${name}.transform`);
    }

    return body;
  }


  private geti18nCode(code: string): string {
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
