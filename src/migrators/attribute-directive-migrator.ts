import colors from 'colors';
import fs from 'fs-extra-promise';
import { Config } from './../../config/config';
import { AttributeDirectiveAnalyser } from './../analysers/attribute-directive-analyser';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { Path } from './../files/models/path';
import { AttributeDirectiveToAngular } from './attribute-directive-to-angular';
import { Migrator } from "./migrator";

export class AttributeDirectiveMigrator extends Migrator {
  constructor(verbose = true) {
    super(verbose, '[ATTRIBUTE DIRECTIVE MIGRATOR]', colors.magenta);
  }

  private async getDirectiveCode(file: File) {
    const directiveAnalyser = new AttributeDirectiveAnalyser();
    const mover = new AttributeDirectiveToAngular();

    let key = file.path.key;

    let directiveContent = '';
    try {
      directiveContent = file.content;
    } catch (e) { }

    const directive = directiveAnalyser.analyse(directiveContent);

    const list = this.explanationGenerator.create('unordered-list', `Generate ${directive.name}`);

    this.doneExplanations.insert(list);

    list.insert(
      this.explanationGenerator.create('chip', `Extract directive name : ${directive.name}`),
      this.explanationGenerator.create('chip', `Extract template url : ${directive.templateUrl}`),
      this.explanationGenerator.create('chip', `Extract controller name : ${directive.controller}`),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract scope : ',
          { type: 'inline-code', content: directive.scope }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract link code : ',
          { type: 'code', content: directive.link }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract injections : ',
          { type: 'code', content: JSON.stringify(directive.injects, null, 2) }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract properties : ',
          { type: 'code', content: JSON.stringify(directive.properties, null, 2) }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          directive.functions.length === 1 && directive.functions[0].name === 'exported' ? 'Extract code to "exported" function' : 'Extract functions',
          { type: 'code', content: JSON.stringify(directive.functions, null, 2) }
        )
      )
    )

    const code = await mover.move(directive);

    const componentCodeList = this.explanationGenerator.create('unordered-list', `Generate directive code`, 4);

    this.doneExplanations.insert(componentCodeList);

    componentCodeList.insert(
      this.explanationGenerator.create('chip', `Insert selector`),
      this.explanationGenerator.create('chip', `Insert directive name`),
      this.explanationGenerator.create('chip', `Insert properties (private)`),
      this.explanationGenerator.create('chip', `Insert injections as constructor parameters (private)`),
      this.explanationGenerator.create('chip', `Insert functions (public), convert all functions in their body to arrow functions and insert function comments`),
      this.explanationGenerator.create('chip', `Set all functions parameters type to any`),
      this.explanationGenerator.create('chip', `Add this reference to inputs, properties and injections calls`)
    )

    let log = this.createLog(`${key.toUpperCase()} DIRECTIVE`, code);

    if (Config.attributeDirectives.generatedFilesFolder) {
      const exist = fs.existsSync(Config.attributeDirectives.generatedFilesFolder);

      if (!exist) {
        fs.mkdirsSync(Config.attributeDirectives.generatedFilesFolder);
      }

      try {
        fs.mkdirsSync(`${Config.attributeDirectives.generatedFilesFolder}/${key}`)
      } catch (err) {

      }

      const pathWithoutFilename = file.path.withoutFilename();

      this.createFile(`${Config.attributeDirectives.generatedFilesFolder}/${key}/${key}${Config.attributeDirectives.generatedPrefix}.directive.ts`, code);


      this.todoExplanations.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.attributeDirectives.generatedFilesFolder}/${key}/${key}${Config.attributeDirectives.generatedPrefix}.directive.ts` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.directive.ts` }
          )
        )
      )
    }

    if (Config.directives.output) {
      this.log(log);
    }
  }

  async launch(): Promise<any> {
    const finder = new FilesFinder();
    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Import new directives in app.module.ts'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for external libraries (like lodash) uses'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for unmigrated code outside of functions or in exported function'),
      this.explanationGenerator.create('unchecked-checkbox', 'Migrate $ injections in constructor to Angular injections'),
      this.explanationGenerator.create('unchecked-checkbox', 'If you use new demo component, create a new route in app.module.ts and remove component from AngularJS router'),
    )

    let files: File[] = [];
    for (const path of Config.attributeDirectives.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSAttributeDirectives(path)
        ]
      }
    }
    for (const file of files) {
      await this.getDirectiveCode(file);
    }
  }
}
