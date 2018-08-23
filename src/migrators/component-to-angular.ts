import { ComponentAnalyser } from './../analysers/component-analyser';
import { AngularJSComponent } from './../analysers/models/angularjs-component';
import { Component } from './../analysers/models/component';
import { Controller } from './../analysers/models/controller';
import { ComponentGenerator } from './../generators/component-generator';
import { DataRemover } from './../utils/data-remover';

export class ComponentToAngular {

  move(angularJSComponent: AngularJSComponent, controller: Controller): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const analyser = new ComponentAnalyser();
      const remover = new DataRemover();
      const generator = new ComponentGenerator();
      const component: Component = analyser.analyse(angularJSComponent, controller);

      const componentName = controller.name.replace('Controller', 'Component');

      try {
        const code = await generator.generate(componentName, component);

        resolve(code);
      } catch (e) {
        reject(e);
      }
    });
  }

}
