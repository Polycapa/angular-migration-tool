import { DataRemover } from './../utils/data-remover';
import { VariableFactory } from './../utils/variable-factory';
import { BracketMatcher } from './bracket-matcher';
import { DirectiveAnalyser } from './directive-analyser';
import { AttributeDirective } from './models/attribute-directive';
import { Function } from './models/function';
import { Variable } from './models/variable';

export class AttributeDirectiveAnalyser extends DirectiveAnalyser {
  analyse(js: string): AttributeDirective {
    const matcher = new BracketMatcher();
    const directive = super.analyse(js);
    const firstBracketIndex = js.indexOf('[');
    const bodyFunction = js
      .substring(firstBracketIndex)
      .substring(0, js
        .substring(firstBracketIndex).indexOf(')') + 1);

    let inject: string[] = [];
    let functions: Function[] = [];
    let properties: Variable[] = [];

    if (bodyFunction) {
      let fnIndex = bodyFunction.indexOf('function');
      let index = firstBracketIndex || 0;
      let fn = js.substring(index + fnIndex);
      fn = fn.substring(0, matcher.match(fn, '{', fn.indexOf('{')) + 1);
      let params = fn.substring(fn.indexOf('(') + 1, fn.indexOf(')')).replace(/ /g, '');
      inject = params.split(',').map(el => el.trim());
    }

    if (directive.link) {
      let index = directive.link.indexOf('{') || 0;
      let match = matcher.match(directive.link, '{', index);
      const body = directive.link.substring(index + 1, match - 1);
      functions = this.getFunctions(body);
      properties = this.getProperties(body);

      let params = directive.link.substring(directive.link.indexOf('(') + 1, directive.link.indexOf(')')).replace(/ /g, '');
      let fnParams: string[] = params.split(',').map((el: any) => el.trim());

      if (!functions.length) {
        const exportedFunction: Function = {
          name: 'unmigrated',
          parameters: this.getVariables(fnParams),
          body: body
        };
        functions.push(exportedFunction);
      }
    }

    const attributeDirective: AttributeDirective = {
      ...directive,
      injects: this.getVariables(inject),
      functions: functions,
      properties: properties
    }

    return attributeDirective;
  }

  private getProperties(body: string): Variable[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();

    let properties: Variable[] = [];
    body = remover.removeJSComments(body);

    const bindThisExp = /\.bind\(this\);?/g

    body = body.replace(bindThisExp, '');

    const thisFunctionsExp = /^\s*this\..*?function.*?{/gm;

    const thisFunctionsMatches = body.match(thisFunctionsExp);

    if (thisFunctionsMatches) {
      for (const match of thisFunctionsMatches) {
        const bracketIndex = body.indexOf(match) + match.length - 1;
        const fn = body
          .substring(body.indexOf(match),
            matcher.match(body, '{', bracketIndex) + 1
          );
        body = body.replace(fn, '');
      }
    }

    properties = properties
      .concat(this.getVarProperties(body))
      .concat(this.getThisProperties(body));

    return properties;
  }

  /**
   * Get all variables declared with var keyword 
   * 
   * @private
   * @param {string} body Body of the controller
   * @returns {Variable[]} Variables detected
   * @memberof ComponentAnalyser
   */
  private getVarProperties(body: string): Variable[] {
    const factory = new VariableFactory();
    const matcher = new BracketMatcher();
    let properties: Variable[] = [];
    // Look for var ending by { (start of an object or function) or ; (other types)
    const propertiesExp = /^\s*var.*?(\n.*?)*[;|{|[]/gm;
    const propertiesMatch = body.match(propertiesExp);


    if (propertiesMatch) {
      for (const match of propertiesMatch) {
        let variable: string = '';
        // Get variable                
        if (match.indexOf('{') !== -1) {
          const bracketIndex = body.indexOf(match) + match.length - 1;
          variable = body
            .substring(body.indexOf(match),
              matcher.match(body, '{', bracketIndex) + 1
            );
        } else if (match.indexOf('[') !== -1) {
          const bracketIndex = body.indexOf(match) + match.length - 1;
          variable = body
            .substring(body.indexOf(match),
              matcher.match(body, '[', bracketIndex) + 1
            );
        } else {
          variable = match.substring(0, match.length - 1);
        }

        if (variable.indexOf('=') === -1) continue;

        // Get variable name on left part
        let name = variable.split('=')[0].replace('var', '').trim();

        // Get variable value on right part
        let value: any = variable.split('=')[1].trim();

        const property = factory.create(name, value);

        // Exclude this property created in controller
        if (property.value !== 'this') {
          properties.push(property)
        }
      }
    }
    return properties;
  }

  /**
   * Get all variables declared with this keyword 
   * 
   * @private
   * @param {string} body Body of the controller 
   * @returns {Variable[]} Variables detected
   * @memberof ComponentAnalyser
   */
  private getThisProperties(body: string): Variable[] {
    const factory = new VariableFactory();
    const matcher = new BracketMatcher();
    let properties: Variable[] = [];
    const thisPropertiesExp = /^\s*this[^\(,]*?(\n.*?)*[;|{|[]/gm
    const thisPropertiesMatch = body.match(thisPropertiesExp);

    if (thisPropertiesMatch) {
      for (let match of thisPropertiesMatch) {
        match = match.replace('this.', '').trim();

        let variable: string = '';
        // Get variable                
        if (match.indexOf('{') !== -1) {
          const bracketIndex = body.indexOf(match) + match.length - 1;
          variable = body
            .substring(body.indexOf(match),
              matcher.match(body, '{', bracketIndex) + 1
            );
        } else if (match.indexOf('[') !== -1) {
          const bracketIndex = body.indexOf(match) + match.length - 1;
          variable = body
            .substring(body.indexOf(match),
              matcher.match(body, '[', bracketIndex) + 1
            );
        } else {
          variable = match.substring(0, match.length - 1);
        }
        // Get variable name on left part
        let name = variable.split('=')[0].replace('var', '').trim();

        // Get variable value on right part
        let value: string = variable
          .split('=')[1]
          .trim();

        const property = factory.create(name, value);

        // Exclude this property created in controller
        if (property.value !== 'this') {
          properties.push(property)
        }
      }
    }
    return properties;
  }

  private getFunctions(body: string): Function[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();
    let functions: Function[] = [];

    const bodyWithoutComments = remover.removeJSComments(body);

    const ctrlFunctionsExp = /ctrl\..*?function.*?{/g;
    const thisFunctionsExp = /this\..*?function.*?{/g;
    let matches = bodyWithoutComments.match(ctrlFunctionsExp) || [];
    const thisMatches = bodyWithoutComments.match(thisFunctionsExp) || [];

    matches = matches.concat(thisMatches);

    for (const match of matches) {
      const bracketIndex = body
        .indexOf(match) + match.length - 1;

      const fn = body
        .substring(body.indexOf(match),
          matcher.match(body, '{', bracketIndex) + 1
        );

      const name = fn
        .split('=')[0]
        .replace('ctrl.', '')
        .replace('this.', '')
        .trim();

      const fnValue = fn
        .substring(fn.indexOf('=') + 1)
        .trim();

      const fnBody = fnValue
        .substring(fnValue.indexOf('{') + 1,
          matcher.match(fnValue, '{', fnValue.indexOf('{')) - 1
        );

      // Get params and remove null element
      const fnParams = fnValue
        .substring(fnValue.indexOf('(') + 1, fnValue.indexOf(')'))
        .split(',')
        .filter(el => el);

      let params: Variable[] = [];
      for (const param of fnParams) {
        let newParam: Variable = {
          name: param,
          type: 'any'
        }
        params.push(newParam);
      }

      let newFn: Function = {
        name: name,
        parameters: params,
        body: fnBody
      }

      functions.push(newFn);

    }
    return functions;
  }

  private getVariables(variables: string[]): Variable[] {
    let createdItems: Variable[] = [];
    for (const item of variables) {
      const variable: Variable = {
        name: item,
        type: 'any',
        value: undefined
      };
      createdItems.push(variable);
    }
    return createdItems;
  }
}
