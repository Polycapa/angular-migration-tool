import beautify from 'js-beautify';
import { BracketMatcher } from './../analysers/bracket-matcher';
import { Function } from './../analysers/models/function';
import { Service } from './../analysers/models/service';
import { Variable } from './../analysers/models/variable';
import { DataExtractor } from './../utils/data-extractor';
import { DataRemover } from './../utils/data-remover';
import { VariableFactory } from './../utils/variable-factory';
import { Injectable } from './models/injectable';

export class InjectableAnalyser {
  analyse(service: Service): Injectable {
    const injectable: Injectable = {
      name: service.name,
      properties: this.getProperties(service),
      functions: this.getFunctions(service),
      injections: this.getInjections(service),
      todo: ''
    };

    const unmigrated = this.getUnmigratedCode(service, injectable.functions!);

    injectable.todo = unmigrated;

    return injectable;
  }

  private getProperties(service: Service): Variable[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();

    let properties: Variable[] = [];
    let body = service.body;
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
        const bracketIndex = body.indexOf(match) + match.length - 1;
        const fn = body
          .substring(body.indexOf(match),
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
    const exp = /^\s*ctrl.*?=(\n|.)*?[;|{|[]/gm;
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

      if (variable.indexOf('=') === -1) continue;

      // Get variable name on left part
      let name = variable.split('=')[0].replace('var', '').trim();

      // Get variable value on right part
      let value: string = variable
        .split('=')[1]
        .trim();

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

  private getFunctions(service: Service): Function[] {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();
    const extractor = new DataExtractor();
    let functions: Function[] = [];

    let body = service.body.replace(/\.bind\(this\);?/g, '');

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

  private getInjections(service: Service): Variable[] {
    let injections: Variable[] = [];
    if (service.inject) {
      for (const inject of service.inject) {
        const property: Variable = {
          name: inject,
          type: 'any',
          value: undefined
        }

        injections.push(property);
      }
    }
    return injections;
  }

  private clearBody(service: Service, functions: Function[]) {
    const matcher = new BracketMatcher();
    const remover = new DataRemover();
    const extractor = new DataExtractor();
    const body = service.body;
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


  private getUnmigratedCode(service: Service, functions: Function[]): string {
    const body = this.clearBody(service, functions);
    return `/*\nTODO: Unmigrated code\n${body}\n*/`;
  }
}
