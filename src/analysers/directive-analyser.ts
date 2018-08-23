import { BracketMatcher } from './bracket-matcher';
import { Directive } from './models/directive';

export class DirectiveAnalyser {
  private readonly nameExp = /directive\s*\(\s*[\n|\r]*['|"].*?['|"]/;
  private readonly templateUrlExp = /templateUrl:\s*'.*?'/;
  private readonly controllerExp = /controller:\s*'.*?'/;
  private readonly scopeExp = /scope:\s*{(\s*[^}]*\n\s*)*}/
  private readonly commentExp = /\s*\/\/.*?[,|\n]/g

  analyse(js: string): Directive {
    const directiveNameMatch = js.match(this.nameExp);
    const templateUrlMatch = js.match(this.templateUrlExp);
    const controllerMatch = js.match(this.controllerExp);
    const scopeMatch = js.match(this.scopeExp);

    let directiveName, templateUrl, controller, scope, link;

    if (directiveNameMatch) {
      directiveName = directiveNameMatch[0];
      directiveName = directiveName.substring(directiveName.indexOf('\'') + 1, directiveName.length - 1)
    }
    if (templateUrlMatch) {
      templateUrl = templateUrlMatch[0];
      templateUrl = templateUrl.substring(templateUrl.indexOf('\'') + 1, templateUrl.length - 1)
    }
    if (controllerMatch) {
      controller = controllerMatch[0];
      controller = controller.substring(controller.indexOf('\'') + 1, controller.length - 1)
    }
    if (scopeMatch) {
      scope = scopeMatch[0];
      scope = scope.substring(scope.indexOf('{')).replace(this.commentExp, '').replace(/[\r|\n| ]/g, '');
    }

    if (js.indexOf('link:') !== -1) {
      link = js.substring(js.indexOf('link:'));
      let matcher = new BracketMatcher();
      link = link.substring(5, matcher.match(link, '{', link.indexOf('{')) + 1).trim()
    }


    const directive: Directive = {
      name: directiveName || '',
      templateUrl: templateUrl || '',
      controller: controller || '',
      scope: scope || '',
      link: link || ''
    }

    return directive;
  }
}
