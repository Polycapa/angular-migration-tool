import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { AttributeDirective } from './../analysers/models/attribute-directive';
import { Variable } from './../analysers/models/variable';
import { RootPath } from './../utils/root-path';

export class DirectiveGenerator {
  generate(directiveName: string, directive: AttributeDirective): Promise<string> {
    const injectionsCode = this.getInjectionsCode(directive);
    const functionsCode = this.insertThisReference(
      this.getFunctionsCode(directive),
      directive.properties,
      directive.injects
    );
    const propertiesCode = this.getPropertiesCode(directive);
    let className = `${directiveName}Directive`;
    className = className.charAt(0).toUpperCase() + className.substring(1);

    const samplePath = path.join(RootPath.path, './samples/directive.sample.ts');

    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath, 'utf8')
        .then(data => {
          data = data
            .replace('$selector', directiveName)
            .replace('$directiveName', className)
            .replace('$properties', propertiesCode)
            .replace('$injections', injectionsCode)
            .replace('$functions', functionsCode);

          data = beautify(data);
          resolve(data);
        })
        .catch(err => reject(err));
    });
  }

  private getInjectionsCode(directive: AttributeDirective): string {
    let code = '';
    if (directive.injects) {
      const injections = directive.injects || [];
      injections.forEach((item, index) => {
        code += `private ${item.name}: ${item.type}`;
        if (index < injections.length - 1) {
          code += ',\n';
        }
      })
    }
    return code;
  }

  private getFunctionsCode(directive: AttributeDirective): string {
    let functionsCode = '';

    if (directive.functions) {
      for (const fn of directive.functions) {
        let body = fn.body;
        const functionsToUpdate = body.match(/function\s*\(.*?\)/g) || [];
        for (const match of functionsToUpdate) {
          let params = match.substring(match.indexOf('('))
          body = body.replace(match, `${params} =>`);
        }
        body = body.replace(/\.bind\(this\)/g, '');
        functionsCode += `public ${fn.name}(${this.getParametersCode(fn.parameters)}){${body}}\n\n`;
      }
    }
    return functionsCode;
  }

  private getParametersCode(params?: Variable[]): string {
    let code = '';
    if (params) {
      params.forEach((param, index) => {
        code += `${param.name}: ${param.type}${param.value ? ` = ${param.value}` : ''}`
        code += index < params.length - 1 ? ',' : '';
      })
    }
    return code;
  }

  private getPropertiesCode(directive: AttributeDirective): string {
    let code = '';
    if (directive.properties) {
      for (const property of directive.properties) {
        let value = typeof property.value === 'string' ? property.value : JSON.stringify(property.value);
        code += `private ${property.name}: ${property.type}${property.value ? ` = ${value}` : ''};\n`
      }
    }
    return code;
  }

  private insertThisReference(code: string, properties: Variable[] = [], injections: Variable[] = []): string {
    const toUpdate = properties.concat(injections);

    // for (const value of toUpdate) {
    //   const name = value.name.replace(/\$/g, '\\$');
    //   const updatedContent = new RegExp(`[^var](\\s|,)${name}`, 'g');
    //   const matchesToUpdate = code.match(updatedContent);
    //   if (matchesToUpdate) {
    //     for (let match of matchesToUpdate) {
    //       code = code.replace(match, `${match.charAt(0)}this.${value.name}`);
    //     }
    //   }
    // }
    code = code.replace(/ctrl/g, 'this');
    return code;
  }
}
