import { VariableFactory } from './../utils/variable-factory';
import { BracketMatcher } from './bracket-matcher';
import { Constant } from './models/constant';
export class ConstantAnalyser {
  analyse(js: string): Constant[] {
    const matcher = new BracketMatcher();
    const exp = /\.constant\(.*?,/g;
    const matches = js.match(exp) || [];

    let constants: Constant[] = [];

    const varExp = /^\s*var.*?=.*?(;|\n|\r)/gm;

    const varMatches = js.match(varExp) || [];

    for (const match of varMatches) {
      const name = match
        .split('=')[0]
        .replace('var', '')
        .trim();

      const value = match
        .split('=')[1]
        .replace(';', '')
        .trim();

      const matchExp = new RegExp(name, 'g');
      js = js.replace(matchExp, value);
    }

    for (const match of matches) {
      const matchIndex = js.indexOf(match);
      const bracketIndex = matchIndex + match.indexOf('(');
      const lastBracketIndex = matcher.match(js, '(', bracketIndex);
      const constantCode = js.substring(matchIndex, lastBracketIndex + 1);
      const constant = this.getConstant(constantCode);
      constants.push(constant);
    }

    return constants;
  }

  private getConstant(constantCode: string): Constant {
    const factory = new VariableFactory();

    const code = constantCode
      .substring(
        constantCode.indexOf('(') + 1,
        constantCode.lastIndexOf(')')
      );

    const name = code
      .substring(0, code.indexOf(','))
      .replace(/('|")/g, '');

    let value = code.substring(code.indexOf(',') + 1);

    const variable = factory.create(name, value);

    return variable;

  }
}
