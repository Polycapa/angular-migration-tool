import { BracketMatcher } from './bracket-matcher';
import { AngularJSComponent } from './models/angularjs-component';

export class AngularJSComponentAnalyser {
  private readonly nameExp = /component\s*\(\s*[\n|\r]*['|"].*?['|"]/;
  private readonly templateUrlExp = /templateUrl:\s*'.*?'/;
  private readonly controllerExp = /controller:\s*'.*?'/;
  private readonly bindingsExp = /bindings:\s*{(\s*[^}]*\n\s*)*}/
  private readonly commentExp = /\s*\/\/.*?[,|\n]/g

  analyse(js: string): AngularJSComponent {
    const componentNameMatch = js.match(this.nameExp);
    const templateUrlMatch = js.match(this.templateUrlExp);
    const controllerMatch = js.match(this.controllerExp);
    const bindingsMatch = js.match(this.bindingsExp);

    let componentName, templateUrl, controller, bindings, link;

    if (componentNameMatch) {
      componentName = componentNameMatch[0];
      componentName = componentName.substring(componentName.indexOf('\'') + 1, componentName.length - 1)
    }
    if (templateUrlMatch) {
      templateUrl = templateUrlMatch[0];
      templateUrl = templateUrl.substring(templateUrl.indexOf('\'') + 1, templateUrl.length - 1)
    }
    if (controllerMatch) {
      controller = controllerMatch[0];
      controller = controller.substring(controller.indexOf('\'') + 1, controller.length - 1)
    }
    if (bindingsMatch) {
      bindings = bindingsMatch[0];
      bindings = bindings.substring(bindings.indexOf('{')).replace(this.commentExp, '').replace(/[\r|\n| ]/g, '');
    }

    if (js.indexOf('link:') !== -1) {
      link = js.substring(js.indexOf('link:'));
      let matcher = new BracketMatcher();
      link = link.substring(5, matcher.match(link, '{', link.indexOf('{')) + 1).trim()
    }


    const component: AngularJSComponent = {
      name: componentName || '',
      templateUrl: templateUrl,
      controller: controller,
      bindings: bindings || ''
    }

    return component;
  }
}
