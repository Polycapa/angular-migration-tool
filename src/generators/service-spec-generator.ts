import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { Config } from './../../config/config';
import { UnitTestDescribe } from './../analysers/models/unit-test-describe';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';
import { SpecGenerator } from './spec-generator';

export class ServiceSpecGenerator extends SpecGenerator {
  generate(serviceName: string, test: UnitTestDescribe): Promise<string> {
    const remover = new DataRemover();
    const mainTitle = test.title;
    let body = '// ' + test.body
      .replace(/\n/g, '\n//')
      .replace(/\r/g, '\r//');

    const moduleName = `${serviceName}Module`

    const key = serviceName
      .replace('Service', '')
      .replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      .replace(/^-/, '');

    let mainContent = '';

    for (const child of test.children) {
      mainContent += this.getCode(child);
    }

    const samplePath = path.join(RootPath.path, './samples/service.spec.sample.ts');


    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath, 'utf-8')
        .then(content => {

          content = content
            .replace('$serviceFile', `./${key}${Config.services.generatedPrefix}.service`)
            .replace('$moduleFile', `./${key}${Config.services.generatedPrefix}.module`)
            .replace(/\$service/g, serviceName)
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

  protected updateBody(body: string): string {
    return body;
  }
}
