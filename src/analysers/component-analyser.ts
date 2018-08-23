import beautify from 'js-beautify';
import { DataExtractor } from './../utils/data-extractor';
import { DataRemover } from './../utils/data-remover';
import { VariableFactory } from './../utils/variable-factory';
import { BracketMatcher } from './bracket-matcher';
import { AngularJSComponent } from './models/angularjs-component';
import { Component } from './models/component';
import { Controller } from './models/controller';
import { Function } from './models/function';
import { Variable } from './models/variable';


export class ComponentAnalyser {
  analyse(angularJSComponent: AngularJSComponent, controller: Controller): Component {
    let component: Component = {
      name: angularJSComponent.name,
      selector: this.getSelector(angularJSComponent),
      templateUrl: this.getTemplateUrl(angularJSComponent),
      styleUrl: this.getStyleUrl(angularJSComponent),
      inputs: this.getComponentInputs(angularJSComponent, controller),
      properties: this.getProperties(controller),
      functions: this.getFunctions(controller),
      injections: this.getInjections(controller),
      todo: ''
    };

    component.properties = this.clearProperties(component.inputs, component.properties);

    const unmigrated = this.getUnmigratedCode(controller, component.functions!);

    component.todo = unmigrated;

    return component;
  }

  private getComponentInputs(component: AngularJSComponent, controller: Controller): Variable[] {
    const bindingsExp = new RegExp(`(?!{).*?[,|}]`, 'g');
    const matches = component.bindings.match(bindingsExp);

    let bindings: Variable[] = [];
    if (matches) {
      for (const match of matches) {
        if (match.indexOf(':') === -1) continue;
        const binding = match.split(':')[0];
        const data = this.getBindingData(controller.body, binding);
        let parameter: Variable = {
          name: binding,
          type: data.type,
          value: data.value
        }
        bindings.push(parameter);
      }
    }
    return bindings;
  }

  private getBindingData(controllerCode: string, binding: string): { type: string, value?: any } {
    let type = 'any';
    let value: any;
    const exp = new RegExp(`${binding}\\s*=.*?;`);
    const match = controllerCode.match(exp);
    if (match) {
      let content = match[0];
      content = content.substring(0, content.length - 1);
      content = (content.split('=').pop() || '').trim();

      try {
        value = JSON.parse(content)
        type = typeof value;
      } catch (e) { }
    }
    return {
      type: type,
      value: value
    };
  }

  private getSelector(component: AngularJSComponent): string {
    const camelToDash = (str: string) => str
      .replace(/(^[A-Z])/, (first) => first.toLowerCase())
      .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`)
    return camelToDash(component.name);
  }


  private getTemplateUrl(component: AngularJSComponent): string {
    const path = component.templateUrl || '';
    let key = path.substring(path.lastIndexOf('/') + 1);
    key = key.substring(0, key.indexOf('.'));
    return key ? `./${key}.template.html` : '';
  }

  private getStyleUrl(component: AngularJSComponent): string {
    const path = component.templateUrl || '';
    let key = path.substring(path.lastIndexOf('/') + 1);
    key = key.substring(0, key.indexOf('.'));
    return key ? `./${key}.scss` : '';
  }

  private getProperties(controller: Controller): Variable[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();

    let properties: Variable[] = [];
    let body = controller.body;
    body = remover.removeJSComments(body);
    body = remover.removeMultilineJSComments(body);

    // Get possible properties
    const ctrlProperties = this.getCtrlProperties(body);

    const ctrlPropertiesExp = /ctrl\..*?=.*?;/g;

    body = body.replace(ctrlPropertiesExp, '');

    const bindThisExp = /\.bind\(this\);?/g

    body = body.replace(bindThisExp, '');

    const functionsExp = /^\s*((ctrl|this|var)\.?.*?=\s*)?function.*?{/gm;

    const functionsMatches = body.match(functionsExp);
    if (functionsMatches) {
      for (const match of functionsMatches) {
        const matchIndex = body.indexOf(match);
        if (matchIndex === -1) { continue; }
        const bracketIndex = matchIndex + match.length - 1;
        const fn = body
          .substring(matchIndex,
            matcher.match(body, '{', bracketIndex) + 2
          );
        body = body.replace(fn, '');
      }
    }

    properties = properties
      .concat(this.getVarProperties(body))
      .concat(this.getThisProperties(body));

    let ctrlPropertiesToAdd = [];
    for (const property of ctrlProperties) {
      if (properties.findIndex(el => el.name === property.name) === -1) {
        ctrlPropertiesToAdd.push(property);
      }
    }

    properties = properties.concat(ctrlPropertiesToAdd);

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
    const propertiesExp = /^\s*var.*?=(\n|.)*?[;|{|[]/gm;
    const propertiesMatch = body.match(propertiesExp);


    if (propertiesMatch) {
      for (const match of propertiesMatch) {
        if (match.indexOf('function') !== -1) continue;
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
    const thisPropertiesExp = /^\s*this.*?=(\n|.)*?[;|{|[]/gm
    const thisPropertiesMatch = body.match(thisPropertiesExp);

    if (thisPropertiesMatch) {
      for (let match of thisPropertiesMatch) {
        if (match.indexOf('function') !== -1) continue;
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

  /**
   * Get all variables declared with ctrl keyword
   * 
   * @private
   * @param {string} body Body of the controller
   * @returns {Variable[]} Variables detected
   * @memberof ComponentAnalyser
   */
  private getCtrlProperties(body: string): Variable[] {
    const factory = new VariableFactory();
    const matcher = new BracketMatcher();
    let properties: Variable[] = [];
    const exp = /^\s*ctrl.*?(=(\n|.)*?)?[;|{|[]/gm;
    const matches = body.match(exp) || [];
    for (let match of matches) {
      if (match.indexOf('function') !== -1) continue;
      match = match.replace('ctrl.', '').trim();

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

      let name = '', value = '';
      if (variable.indexOf('=') === -1) {
        name = variable.replace(';', '').replace('var', '').trim();
      } else {
        // Get variable name on left part
        name = variable.split('=')[0].replace('var', '').trim();

        // Get variable value on right part
        value = variable
          .split('=')[1]
          .trim();
      }


      let property = factory.create(name, value);

      property.value = undefined;

      if (properties.findIndex(el => el.name === property.name) === -1 && property.value !== 'this') {
        properties.push(property);
      }
    }

    properties = properties
      .filter(prop => prop.name.indexOf('.') === -1);

    return properties;
  }

  private getFunctions(controller: Controller): Function[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();
    const extractor = new DataExtractor();
    let functions: Function[] = [];

    let body = controller.body.replace(/\.bind\(this\);?/g, '');

    const bodyWithoutComments = remover.removeJSComments(body);

    // const functionsWithCommentExp = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/(\n|\r)\s*)?(ctrl|this|var)\.?.*?=\s*function.*?{/g
    const functionsExp = /(ctrl|this|var)\.?.*?=\s*function.*?{/g
    let matches = bodyWithoutComments.match(functionsExp) || [];

    const comments = extractor.extractMultilineJSComments(bodyWithoutComments);

    for (const match of matches) {
      const matchIndex = body
        .indexOf(match);
      if (matchIndex === -1) continue;
      const bracketIndex = matchIndex + match.length - 1;
      const lastBracketIndex = matcher.match(body, '{', bracketIndex);

      let fn = body
        .substring(body.indexOf(match),
          matcher.match(body, '{', bracketIndex) + 1
        );

      const name = fn
        .split('=')[0]
        .replace('ctrl.', '')
        .replace('this.', '')
        .replace('var', '')
        .trim();

      if (name.indexOf('function') !== -1) continue;

      const comment = comments.find(el => {
        const exp = new RegExp(`@name\\s*${name}`);
        return el.match(exp) ? true : false;
      }) || '';

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
        body: fnBody,
        comment: comment
      }

      body = body.substring(0, matchIndex) + body.substring(lastBracketIndex + 2);

      functions.push(newFn);

    }
    return functions;
  }

  private clearBody(controller: Controller, functions: Function[]) {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();
    const extractor = new DataExtractor();
    const body = controller.body;
    let cleared = remover.removeMultilineJSComments(
      remover.removeJSComments(body)
    ).replace(/.bind\(this\);?/g, '');

    for (const fn of functions) {
      const name = fn.name
        .replace(/\$/g, '\\$');
      const exp = new RegExp(`(ctrl|this|var)\.?\\s*${name}.*?function.*?{`);

      const match = cleared.match(exp);

      if (match) {
        const bracketIndex = match.index! + match[0].indexOf('{');
        const lastBracketIndex = matcher.match(cleared, '{', bracketIndex);
        // const fnExp = new RegExp(`${match[0]}${fn.body}};?`);
        cleared = cleared.substring(0, match.index!) + cleared.substring(lastBracketIndex + 2);
      }
    }

    let toSave: string[] = [];
    const $eventExp = /^\s*ctrl\.\$(watch|on)\(/gm;
    const $eventMatches = cleared.match($eventExp) || [];

    for (let match of $eventMatches) {
      const matchIndex = cleared.indexOf(match);
      match = match.trim();

      const bracketIndex = cleared.indexOf(match) + match.length - 1;
      const lastBracketIndex = matcher.match(cleared, '(', bracketIndex);
      const el = cleared.substring(matchIndex, lastBracketIndex + 1);
      toSave.push(el);
      cleared = cleared.substring(0, matchIndex) + cleared.substring(lastBracketIndex + 2);
    }

    const aloneFnExp = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/(\n|\r)\s*)?^\s*function\s+\w*\(.*?\)\s*{/gm;
    const aloneFnMatches = cleared.match(aloneFnExp) || [];

    for (const match of aloneFnMatches) {
      const matchIndex = cleared.indexOf(match);
      const bracketIndex = matchIndex + match.indexOf('{');
      const lastBracketIndex = matcher.match(cleared, '{', bracketIndex);
      const el = cleared.substring(matchIndex, lastBracketIndex + 1);
      toSave.push(el);
      cleared = cleared.substring(0, matchIndex) + cleared.substring(lastBracketIndex + 2);
    }

    const propertiesExp = /^\s*(ctrl|var|this)[^\(,]*?(\n.*?)*[;|{|[]/gm;

    const propertiesMatches = cleared.match(propertiesExp) || [];

    for (let match of propertiesMatches) {
      const matchIndex = cleared.indexOf(match);
      match = match.trim();

      // Get variable                
      if (match.indexOf('{') !== -1) {
        const bracketIndex = cleared.indexOf(match) + match.length - 1;
        const lastBracketIndex = matcher.match(cleared, '{', bracketIndex);
        cleared = cleared.substring(0, matchIndex) + cleared.substring(lastBracketIndex + 2);
      } else if (match.indexOf('[') !== -1) {
        const bracketIndex = cleared.indexOf(match) + match.length - 1;
        const lastBracketIndex = matcher.match(cleared, '[', bracketIndex);
        cleared = cleared.substring(0, matchIndex) + cleared.substring(lastBracketIndex + 2);
      } else {
        const varExp = new RegExp(match, 'g');
        cleared = cleared.replace(varExp, '');
      }

    }

    cleared = remover.removeEmptyLines(cleared);

    cleared += toSave.join('\n');

    return beautify(cleared);
  }

  private getUnmigratedCode(controller: Controller, functions: Function[]): string {
    const body = this.clearBody(controller, functions);
    return `/*\nTODO: Unmigrated code\n${body}\n*/`;
  }

  /**
   * Remove properties that are already declared as inputs
   * 
   * @private
   * @param {Variable[]} [componentInputs=[]] Component inputs
   * @param {Variable[]} [properties=[]] Properties to clear
   * @returns {Variable[]} Cleared properties
   * @memberof ComponentAnalyser
   */
  private clearProperties(componentInputs: Variable[] = [], properties: Variable[] = []): Variable[] {
    return properties
      .map(el => {
        if (componentInputs.findIndex(input => input.name === el.name) === -1) {
          return el;
        }
        const emptyVar: Variable = {
          name: '',
          type: ''
        };
        return emptyVar;
      })
      .filter(el => el.name !== '');
  }

  private getInjections(controller: Controller): Variable[] {
    let injections: Variable[] = [];
    for (const inject of controller.inject) {
      const variable: Variable = {
        name: inject,
        type: 'any',
        value: undefined
      };
      injections.push(variable);
    }
    return injections;
  }

}
