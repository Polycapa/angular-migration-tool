import { BracketMatcher } from './bracket-matcher';
import { Service } from './models/service';

export class ServiceAnalyser {
  private readonly nameExp = /service\s*\(\s*[\n|\r]*['|"].*?['|"]/;
  private readonly bodyFunctionExp = /\[.*?[\n|\r|,]\s*function\s*\(\$?.*?\)/;

  analyse(js: string): Service {
    const nameMatch = js.match(this.nameExp);
    const bodyFunctionMatch = js.match(this.bodyFunctionExp);

    let name: string = '';
    let body: string = '';
    let inject: string[] = [];

    if (nameMatch) {
      name = nameMatch[0];
      name = name.substring(name.indexOf('\'') + 1, name.length - 1)
    }

    if (bodyFunctionMatch) {
      const matcher = new BracketMatcher();
      let fnIndex = bodyFunctionMatch[0].indexOf('function');
      let index = bodyFunctionMatch.index || 0;
      let fn = js.substring(index + fnIndex);
      fn = fn.substring(0, matcher.match(fn, '{', fn.indexOf('{')) + 1);
      body = fn.substring(fn.indexOf('{') + 1, fn.length - 1);

      let declarationMatch = fn.match(/function\s*\(\$?.*?\)/);
      if (declarationMatch) {
        let match = declarationMatch[0];
        let params = match.substring(match.indexOf('(') + 1, match.lastIndexOf(')')).replace(/ /g, '');
        inject = params.split(',');
      }
    }
    const service: Service = {
      name: name,
      body: body,
      inject: inject
    };
    return service;
  }
}
