import beautify from 'js-beautify';
import path from 'path';
import { Filter } from '../analysers/models/filter';
import { Variable } from '../analysers/models/variable';
import { Path } from '../files/models/path';
import { RootPath } from '../utils/root-path';
import { File } from './../files/models/file';

export class PipeGenerator {
  async generate(filter: Filter): Promise<string> {
    const className = this.getClassName(filter);
    const injectionsCode = this.getInjectionsCode(filter);
    const paramsCode = this.getParametersCode(filter.params);
    const bodyCode = this.getBodyCode(filter);

    const samplePath = path.join(RootPath.path, './samples/pipe.sample.ts');
    const file = new File(new Path(samplePath));

    let content = file.content
      .replace('$name', filter.name)
      .replace('$className', className)
      .replace('$injections', injectionsCode)
      .replace('$params', paramsCode)
      .replace('$body', bodyCode);

    return beautify(content);
  }

  private getClassName(filter: Filter): string {
    return filter.name.charAt(0).toUpperCase() + filter.name.substring(1) + 'Pipe';
  }

  private getInjectionsCode(filter: Filter): string {
    let code = '';
    if (filter.injections) {
      const injections = filter.injections || [];
      injections.forEach((item, index) => {
        code += `private ${item.name}: ${item.type}`;
        if (index < injections.length - 1) {
          code += ',\n';
        }
      })
    }
    return code;
  }

  private getBodyCode(filter: Filter): string {
    let code = filter.body;

    const exp = /^\s*.*?\$filter\((.*?)\).*?(\n|\r)/gm;
    const matches = code.match(exp) || [];

    for (const match of matches) {
      let _match = match;
      const filterExp = /\$filter\((.*?)\)/;
      const filterMatch = match.match(filterExp);
      if (!filterMatch) continue;

      const filter = filterMatch[1]
        .replace(/('|")/g, '')
        .trim();

      _match = match.replace(filterMatch[0], `this.${filter}Pipe.transform`);

      code = code.replace(match, `//TODO: Import ${filter} pipe${_match}`);
    }

    return code;
  }

  private getParametersCode(params: Variable[]): string {
    let code = '';
    if (params) {
      params.forEach((param, index) => {
        code += `${param.name}: ${param.type}${param.value ? ` = ${param.value}` : ''}`
        code += index < params.length - 1 ? ',' : '';
      })
    }
    return code;
  }
}
