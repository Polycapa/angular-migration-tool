import { VariableFactory } from '../utils/variable-factory';
import { BracketMatcher } from './bracket-matcher';
import { Filter } from './models/filter';
import { Variable } from './models/variable';
export class FilterAnalyser {
  analyse(js: string): Filter[] {
    const matcher = new BracketMatcher();
    const exp = /\.filter\(.*?,/g;
    const matches = js.match(exp) || [];

    let filters: Filter[] = [];

    for (const match of matches) {
      const matchIndex = js.indexOf(match);
      const bracketIndex = matchIndex + match.indexOf('(');
      const lastBracketIndex = matcher.match(js, '(', bracketIndex);
      const filterCode = js.substring(matchIndex, lastBracketIndex + 1);
      const filter = this.getFilter(filterCode);
      filters.push(filter);
    }

    return filters;
  }

  private getFilter(filterCode: string): Filter {
    const factory = new VariableFactory();

    const code = filterCode
      .substring(
        filterCode.indexOf('(') + 1,
        filterCode.lastIndexOf(')')
      );

    const name = code
      .substring(0, code.indexOf(','))
      .replace(/('|")/g, '');

    const fn = code.substring(code.indexOf(',') + 1);

    const fnInjections = fn
      .substring(
        fn.indexOf('(') + 1,
        fn.indexOf(')')
      )
      .split(',');

    let injections: Variable[] = [];

    for (const injection of fnInjections) {
      if (!injection) continue;
      injections.push(factory.create(injection, ''));
    }

    const filterFunction = fn
      .substring(fn.indexOf('{') + 1, fn.lastIndexOf('}'))
      .replace('return', '')
      .trim();

    const filterParams = filterFunction
      .substring(
        filterFunction.indexOf('(') + 1,
        filterFunction.indexOf(')')
      )
      .split(',');

    let params: Variable[] = [];

    for (const param of filterParams) {
      if (!param) continue;
      params.push(factory.create(param, ''));
    }

    const filterBody = filterFunction
      .substring(
        filterFunction.indexOf('{') + 1,
        filterFunction.lastIndexOf('}')
      )
      .trim();

    const filter: Filter = {
      name: name,
      params: params,
      body: filterBody,
      injections: injections
    }

    return filter;
  }
}
