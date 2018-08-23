import { BracketMatcher } from './bracket-matcher';
import { Controller } from './models/controller';

export class ControllerAnalyser {
  private readonly nameExp = /controller\s*\(\s*[\n|\r]*['|"].*?['|"]/;
  private readonly bodyFunctionExp = /\[.*?[\n|\r|,]\s*function\s*\(\$?.*?\)/;

  analyse(js: string): Controller {
    const nameMatch = js.match(this.nameExp);
    const bodyFunctionMatch = js.match(this.bodyFunctionExp);

    let name: string = '';
    let body: string = '';
    let inject: string[] = [];

    if (nameMatch) {
      name = nameMatch[0];
      name = name.substring(name.indexOf('\'') + 1, name.length - 1)
    }

    const firstBracketIndex = js.indexOf('[');
    const lastBracketIndex = js.lastIndexOf(']');
    const bodyFunction = js
      .substring(firstBracketIndex)
      .substring(0, js
        .substring(firstBracketIndex).indexOf(')') + 1);


    if (bodyFunction) {
      let fnIndex = bodyFunction.indexOf('function');
      let index = firstBracketIndex || 0;
      let fn = js.substring(index + fnIndex, lastBracketIndex);
      const fnBracketIndex = fn.indexOf('{');
      body = fn.substring(fnBracketIndex + 1, fn.lastIndexOf('}'));

      let declarationMatch = fn.match(/function\s*\(\$?.*?\)/);
      let params = fn.substring(fn.indexOf('(') + 1, fn.indexOf(')')).replace(/ /g, '');
      inject = params
        .split(',')
        .map(el => el.trim())
        .filter(el => el);
    }

    const controller: Controller = {
      name: name,
      body: body,
      inject: inject
    };

    return controller;
  }
}
