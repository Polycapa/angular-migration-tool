import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { Service } from '../analysers/models/service';
import { DataRemover } from '../utils/data-remover';
import { Config } from './../../config/config';
import { InjectableAnalyser } from './../analysers/injectable-analyser';
import { Injectable } from './../analysers/models/injectable';
import { Variable } from './../analysers/models/variable';
import { RootPath } from './../utils/root-path';

export class ServiceToInjectable {
  move(key: string, service: Service): Promise<any> {
    return new Promise((resolve, reject) => {
      const remover = new DataRemover();
      const analyser = new InjectableAnalyser();
      const injectable = analyser.analyse(service);

      const propertiesCode = this.getPropertiesCode(injectable);
      const injectionsCode = this.getInjectionsCode(injectable);
      const functionsCode = this.insertThisReference(
        this.getFunctionsCode(injectable),
        injectable.properties,
        injectable.injections
      );

      const moduleName = `${service.name}Module`;

      const samplePath = path.join(
        RootPath.path,
        './samples/service.sample.ts'
      );

      fs.readFileAsync(samplePath)
        .then(data => {
          let content = data
            .toString()
            .replace('$serviceName', injectable.name)
            .replace('$properties', propertiesCode)
            .replace(
              '$injections',
              Config.services.insertInjections ? injectionsCode : ''
            )
            .replace('$functions', functionsCode)
            .replace('$todo', injectable.todo)
            .replace('$moduleName', moduleName)
            .replace(
              '$moduleImport',
              `import { ${moduleName} } from './${key}${
                Config.services.generatedPrefix
              }.module';`
            );

          if (Config.services.downgrade) {
            content = this.downgradeService(content)
              .replace('$moduleName', Config.moduleName)
              .replace('$serviceName', injectable.name)
              .replace('$service', service.name);
          } else {
            // Remove downgrade code comments if downgrade is set to false
            content = remover.removeJSComments(content);
          }

          content = beautify(content);
          resolve(content);
        })
        .catch(err => reject(err));
    });
  }

  private getPropertiesCode(injectable: Injectable): string {
    let code = '';
    if (injectable.properties) {
      for (const property of injectable.properties) {
        let value =
          typeof property.value === 'string'
            ? property.value
            : JSON.stringify(property.value);
        code += `private ${property.name}: ${property.type}${
          property.value ? ` = ${value}` : ''
        };\n`;
      }
    }
    return code;
  }

  private getInjectionsCode(injectable: Injectable): string {
    let code = '';
    if (injectable.injections) {
      injectable.injections.forEach((item, index) => {
        code += `private ${item.name}: ${item.type}`;
        if (index < injectable.injections.length - 1) {
          code += ',\n';
        }
      });
    }
    return code;
  }

  private getFunctionsCode(injectable: Injectable): string {
    let code = '';
    if (injectable.functions) {
      for (const fn of injectable.functions) {
        let body = fn.body;
        const functionsToUpdate = body.match(/function\(.*?\)/g) || [];
        for (const match of functionsToUpdate) {
          let params = match.substring(match.indexOf('('));
          body = body.replace(match, `${params} =>`);
        }
        body = body.replace(/\.bind\(this\)/g, '');
        code += `public ${fn.name}(${this.getParametersCode(
          fn.parameters
        )}): any {${body}}\n\n`;
      }
    }
    return code;
  }

  private getParametersCode(params?: Variable[]): string {
    let code = '';
    if (params) {
      params.forEach((param, index) => {
        code += `${param.name}: ${param.type}${
          param.value ? ` = ${param.value}` : ''
        }`;
        code += index < params.length - 1 ? ',' : '';
      });
    }
    return code;
  }

  private insertThisReference(
    code: string,
    properties: Variable[] = [],
    injections: Variable[] = []
  ): string {
    const toUpdate = Config.services.insertInjections
      ? properties.concat(injections)
      : properties;

    // for (const value of toUpdate) {
    //   const name = value.name.replace(/\$/g, '\\$');
    //   const updatedContent = new RegExp(`[^var,](\\s|,|\\(|\\[)${name}`, 'g');
    //   const matchesToUpdate = code.match(updatedContent);
    //   if (matchesToUpdate) {
    //     for (const match of matchesToUpdate) {
    //       let updatedMatch = match.replace(value.name, `this.${value.name}`)
    //       code = code.replace(match, updatedMatch);
    //     }
    //   }
    // }
    return code;
  }

  private downgradeService(serviceCode: string) {
    const downgradeExp = new RegExp(
      '// DOWNGRADE([\n|\r].*?)*// END DOWNGRADE',
      'g'
    );
    const downgradeMatches = serviceCode.match(downgradeExp) || [];
    for (const match of downgradeMatches) {
      let code = match
        .replace('// DOWNGRADE', '')
        .replace('// END DOWNGRADE', '')
        .replace(/\/\/\s/g, '');
      serviceCode = serviceCode.replace(match, code);
    }
    return serviceCode;
  }
}
