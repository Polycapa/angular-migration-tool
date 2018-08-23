import { AttributeDirective } from './../analysers/models/attribute-directive';
import { DirectiveGenerator } from './../generators/directive-generator';
export class AttributeDirectiveToAngular {

  move(directive: AttributeDirective): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const generator = new DirectiveGenerator();
      try {
        const code = await generator.generate(directive.name, directive);

        resolve(code);
      } catch (e) {
        reject(e);
      }
    });
  }
}
