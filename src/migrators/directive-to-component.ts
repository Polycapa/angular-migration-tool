import { Variable } from './../analysers/models/variable';
import { BracketMatcher } from './../analysers/bracket-matcher';
import { Watcher } from './../analysers/models/watcher';
import { Config } from '../../config/config';
import { Controller } from '../analysers/models/controller';
import { Directive } from '../analysers/models/directive';

import beautify = require('js-beautify');


export class DirectiveToComponent {

  move(directive: Directive, controller: Controller): { componentCode: string, controllerCode: string } {
    if (!directive.controller) {
      directive.controller = controller.name;
    }
    const componentCode = this.moveDirective(directive);
    const controllerCode = this.moveController(controller, directive);

    return {
      componentCode: componentCode,
      controllerCode: controllerCode
    }
  }

  private moveDirective(directive: Directive): string {
    let component = `angular
    .module('${Config.moduleName}')
    .component('${directive.name}', {
        ${directive.templateUrl ? `templateUrl: '${directive.templateUrl}',` : ''}
        bindings: ${directive.scope ? `${directive.scope},` : '{}'}
        ${directive.controller ? `controller: '${directive.controller}'` : ''}
    });`;

    return beautify(component);
  }

  private moveController(controller: Controller, directive: Directive) {
    let injects = controller.inject;

    // Injections to display in new controller
    let finalInjects = '';
    // Removed injections to display warning for
    let toWatch: string[] = [];
    // Injections array
    let injectsToKeep: string[] = [];
    if (injects.length) {
      injects.forEach((value, index) => {
        if (value.indexOf('$') === -1 && directive.scope.indexOf(value) !== -1) {
          toWatch.push(value);
        } else if (value !== '$scope') {
          injectsToKeep.push(value);
        }
      })

      injectsToKeep.forEach((value, index) => {
        finalInjects += `'${value}'`;
        if (index < injectsToKeep.length - 1) {
          finalInjects += ',';
        }
      })
    }


    let body = 'var ctrl = this;\n' + controller.body
    if (directive.link) {
      body += directive.link.substring(directive.link.indexOf('{') + 1, directive.link.length - 1);
    }

    const watchers = this.getWatchers(body);
    body = this.removeWatchers(body);
    body += this.getDoCheck(watchers);

    if (body.indexOf('$scope')) {
      body = body.replace(/\$scope/g, 'ctrl')
    }
    if (body.indexOf('scope')) {
      body = body.replace(/scope/g, 'ctrl')
    }

    if (toWatch.length) {
      for (const watched of toWatch) {

        if (Config.directives.updateRemovedInjectedBindings) {
          const updatedRemovedInjectionsExp = new RegExp(`[^\\.\\w({]${watched}`, 'g');
          const matchesToUpdate = body.match(updatedRemovedInjectionsExp);
          if (matchesToUpdate) {
            for (const match of matchesToUpdate) {
              body = body.replace(match, `ctrl.${watched}`);
            }
          }
        }

        if (Config.directives.generateUndeclaredWarning) {
          const exp = new RegExp(`.*?=.*?${watched}.*?[\n|\r]`,
            'g');
          const matches = body.match(exp);
          if (matches) {
            for (const match of matches) {
              let newLine = `// WARNING : ${watched} may be not declared\n${match}`;
              body = body.replace(match, newLine);
            }
          }
        }
      }
    }

    const controllerCode = `
            angular
                .module('${Config.moduleName}')
                .controller('${controller.name}', [${finalInjects ? `${finalInjects},` : ''} function (${injectsToKeep.toString()}) {
                    ${body}   
                }]);
            `;

    return beautify(controllerCode);
  }

  private getWatchers(body: string): Watcher[] {
    const matcher = new BracketMatcher();
    const exp = /^\s*\$scope\.\$watch\(/gm;
    let watchers: Watcher[] = [];

    const matches = body.match(exp) || [];

    for (const match of matches) {
      const matchIndex = body.indexOf(match);
      const firstBracketIndex = match.indexOf('(');
      const lastBracketIndex = matcher.match(body, '(', matchIndex + firstBracketIndex);
      let watch = body.substring(matchIndex, lastBracketIndex + 1);
      body = body.substring(0, matchIndex) + body.substring(lastBracketIndex + 2);

      let target = watch.substring(watch.indexOf('(') + 2, watch.indexOf(',') - 1);

      if (target.indexOf('function') !== -1) {
        const targetIndex = watch.indexOf(target);
        const targetFirstBracketIndex = watch.indexOf('{', targetIndex);
        const targetLastBracketIndex = matcher.match(watch, '{', targetFirstBracketIndex);
        const fn = watch.substring(targetIndex, targetLastBracketIndex + 1);
        target = `(${fn.trim()})()`;
        watch = watch.substring(targetLastBracketIndex + 1);
      }

      const fnParamExp = /function\s*\((.*?)\)/
      const fnParamMatch = watch.match(fnParamExp);
      const newValueParameter = fnParamMatch ? fnParamMatch[1] : '';


      // If index !== -1, body is the anonymous function body, otherwise it's a reference to a function
      const fnBody = watch.indexOf('function') !== - 1 ? watch.substring(watch.indexOf('{') + 1, watch.lastIndexOf('}')) : watch.substring(watch.indexOf(',') + 1, watch.lastIndexOf(')')) + `($oldValue, $newValue);`;

      const watcher: Watcher = {
        target: target,
        body: fnBody.trim(),
        newValueParameter: newValueParameter
      }

      watchers.push(watcher);
    }
    return watchers;
  }

  private removeWatchers(body: string): string {
    const matcher = new BracketMatcher();
    const exp = /^\s*\$scope\.\$watch\(/gm;

    const matches = body.match(exp) || [];

    for (const match of matches) {
      const matchIndex = body.indexOf(match);
      const firstBracketIndex = match.indexOf('(');
      const lastBracketIndex = matcher.match(body, '(', matchIndex + firstBracketIndex);
      const watch = body.substring(matchIndex, lastBracketIndex + 1);
      body = body.substring(0, matchIndex) + body.substring(lastBracketIndex + 2);
    }
    return body;
  }

  private getDoCheck(watchers: Watcher[]): string {
    let oldValueVariablesCode = '';
    let code = '';

    let index = 0;
    for (const watcher of watchers) {
      let varName = watcher.target.indexOf('function') === -1
        ? watcher.target
        : watcher.newValueParameter;

      if (!varName) {
        varName = `${index}`;
        index++;
      }

      const name = 'old' + varName
        .replace(/^[a-z]/, letter => letter.toUpperCase())
        .replace(/-[a-z]/g, match => match.charAt(1).toUpperCase())
        .replace(/\.[a-z]/g, match => match.charAt(1).toUpperCase());

      oldValueVariablesCode += `var ${name} = undefined;\n`;

      const targetCode = watcher.target.indexOf('function') === - 1 ? `ctrl.${watcher.target}` : watcher.target;

      let watcherCode = watcher.body
        .replace('$oldValue', name)
        .replace('$newValue', targetCode);

      if (watcher.newValueParameter) {
        const newValueExp = new RegExp(watcher.newValueParameter, 'g');
        watcherCode = watcherCode.replace(newValueExp, targetCode);
      }


      code += `
      if (${name} !== ${targetCode}) {
        ${name} = ${targetCode};
        ${watcherCode}
      }
      `
    }

    return `
    ${oldValueVariablesCode}
    ctrl.$doCheck = function() {
      ${code}
    }
    `;
  }
}
