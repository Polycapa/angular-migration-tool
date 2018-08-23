import colors from 'colors';
import fs from 'fs-extra-promise';
import path from 'path';
import { GeneratedContent } from '../explainer/models/generated-content';
import { Config } from './../../config/config';
import { AngularJSComponentAnalyser } from './../analysers/angularjs-component-analyser';
import { ControllerAnalyser } from './../analysers/controller-analyser';
import { Controller } from './../analysers/models/controller';
import { UnitTestAnalyser } from './../analysers/unit-test-analyser';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { Path } from './../files/models/path';
import { SpecGenerator } from './../generators/spec-generator';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';
import { ComponentToAngular } from './component-to-angular';
import { Migrator } from './migrator';

export class ControllerMigrator extends Migrator {
  private currentExplanation: GeneratedContent | undefined;
  private todoCurrentExplanation: GeneratedContent | undefined;

  constructor(verbose = true) {
    super(verbose, '[CONTROLLER TO ANGULAR]');
  }

  async getControllerCode(file: File) {
    const finder = new FilesFinder();
    const angularJSComponentAnalyser = new AngularJSComponentAnalyser();
    const controllerAnalyser = new ControllerAnalyser();
    const mover = new ComponentToAngular();

    const key = file.path.key;
    const { template: templateFile, controllerSpec: controllerSpecFile } = await finder.findAngularJSControllerRelatedFiles(file);

    let controllerContent = '';

    try {
      controllerContent = file.content;
    } catch (e) {
      this.log(e, colors.red);
    }

    const angularJSComponent = angularJSComponentAnalyser.analyse('');
    const controller = controllerAnalyser.analyse(controllerContent);

    controller.body = controller.body.replace(/\$scope/g, 'ctrl');

    angularJSComponent.name = controller.name.replace('Controller', 'Component');
    angularJSComponent.controller = controller.name;
    angularJSComponent.templateUrl = templateFile ? templateFile.path.value : '';

    this.currentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${controller.name}`, 2)

    this.todoCurrentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${controller.name}`, 2);

    this.doneExplanations.insert(this.currentExplanation);
    this.todoExplanations.insert(this.todoCurrentExplanation);

    const code = await mover.move(angularJSComponent, controller);

    let log = this.createLog(`${key.toUpperCase()} ANGULAR COMPONENT`, code);

    if (!Config.controllers.generatedFilesFolder) { return; }

    fs.mkdirsSync(`${Config.controllers.generatedFilesFolder}/${key}`);

    // Generate component
    this.createFile(`${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.component.ts`, code);

    const moduleCode = await this.generateModuleCode(key, controller);

    this.createFile(`${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.module.ts`, moduleCode);

    const pathWithoutFilename = file.path.withoutFilename();

    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Move ',
          { type: 'bold', content: `${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.component.ts` },
          ' to ',
          { type: 'bold', content: `${pathWithoutFilename}/${key}.component.ts` }
        )
      )
    )

    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Move ',
          { type: 'bold', content: `${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.module.ts` },
          ' to ',
          { type: 'bold', content: `${pathWithoutFilename}/${key}.module.ts` }
        )
      )
    )

    if (templateFile) {
      const templateCode = await this.generateTemplateCode(templateFile);
      log += this.createLog(`${key.toUpperCase()} ANGULAR TEMPLATE`, templateCode);
      this.createFile(`${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.template.html`, templateCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.template.html` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.template.html` }
          )
        )
      )
    }

    if (controllerSpecFile) {
      const unitTest = await this.generateSpecCode(controllerSpecFile);
      log += this.createLog(`${key.toUpperCase()} ANGULAR COMPONENT SPEC`, unitTest);
      this.createFile(`${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.component.spec.ts`, unitTest);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.controllers.generatedFilesFolder}/${key}/${key}${Config.controllers.generatedPrefix}.component.spec.ts` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.component.spec.ts` }
          )
        )
      )
    }

    if (Config.controllers.output) {
      this.log(log);
    }
  }

  private async generateTemplateCode(templateFile: File): Promise<any> {
    const remover = new DataRemover();

    let content = templateFile.content;
    const expToReplace: {
      [key: string]: (content: string) => string
    } = {
      "ng-click": () => "(click)",
      "ng-href": () => "[href]",
      "ng-class": () => "[ngClass]",
      "ng-style": () => "[ngStyle]",
      "ng-if": () => "*ngIf",
      "ng-show": () => "*ngIf",
      "ng-src=\".*?\"": (match) => {
        match = match.substring(match.indexOf('"') + 1);
        match = match.substring(0, match.length - 1);
        match = remover.removeBindingBrackets(match);

        return `[src]="${match}"`;
      },
      "ng-bind": () => "[innerHtml]",
      "ng-repeat=\".*?\"": (match) => {
        match = match.substring(match.indexOf('"') + 1);
        match = match.substring(0, match.length - 1);
        let repeatKey = match.split('in')[0].trim();
        let repeatItems = match.split('in')[1].trim();
        return `*ngFor="let ${repeatKey} of ${repeatItems}"`;
      },
      "ng-switch on": () => "[ngSwitch]",
      "ng-switch-when": () => "*ngSwitchCase",
      "ng-switch-default": () => "*ngSwitchDefault",
      "ng-hide=\".*?\"": (match) => {
        match = match.substring(match.indexOf('"') + 1);
        match = match.substring(0, match.length - 1);
        return `*ngIf="!${match}"`;
      },
      "ng-model": () => "[(ngModel)]",
      "\\$ctrl.": () => ""
    };

    const list = this.explanationGenerator.create('unordered-list', 'Generate template code', 4);

    this.currentExplanation!.insert(list);

    for (const exp in expToReplace) {
      const reg = new RegExp(exp, 'g');
      const matches = content.match(reg);
      if (matches) {
        for (const match of matches) {
          const replacer = expToReplace[exp](match);
          content = content.replace(match, replacer);

          list.insert(
            this.explanationGenerator.create('chip',
              this.explanationGenerator.buildMarkdown(
                'Replace ',
                { type: 'inline-code', content: match },
                ' by ',
                { type: 'inline-code', content: replacer }
              )
            )
          )
        }
      }
    }

    return content;
  }

  private async generateModuleCode(key: string, controller: Controller): Promise<string> {
    const samplePath = new Path(path.join(RootPath.path, './samples/feature.module.sample.ts'));

    const sample = new File(samplePath);

    const moduleName = controller.name.replace('Controller', 'Module');
    const componentName = controller.name.replace('Controller', 'Component');

    let code = sample.content
      .replace('$moduleName', moduleName)
      .replace('$declarations', componentName)
      .replace('$exports', componentName)
      .replace('$providers', '')
      .replace('$import', `import { ${componentName} } from './${key}${Config.components.generatedPrefix}.component';`);

    code = this.getModulei18nCode(code);

    return code;
  }

  private getModulei18nCode(appModuleCode: string): string {
    const i18nExp = new RegExp('\/\/ I18N([\n|\r].*?)*\/\/ END I18N', 'g');
    const i18nMatches = appModuleCode.match(i18nExp) || [];
    for (const match of i18nMatches) {
      let code = Config.i18n.generate ?
        match
          .replace('// I18N', '')
          .replace('// END I18N', '')
          .replace(/\/\/\s/g, '')
        : '';
      appModuleCode = appModuleCode.replace(match, code);
    }

    const list = this.explanationGenerator.create('unordered-list', `TranslateModule`, 2)!

    list.insert(
      this.explanationGenerator.create('line', `Insert TranslateModule code in component module`)!,
      this.explanationGenerator.create('line', `Insert HttpLoaderFactory code in component module`)!
    );

    this.doneExplanations.insert(list);

    return appModuleCode;
  }

  private async generateSpecCode(controllerSpecFile: File): Promise<string> {
    const specAnalyser = new UnitTestAnalyser();
    const generator = new SpecGenerator();
    const key = controllerSpecFile.path.key;
    const componentName = `${key}Component`
      .replace(/^[a-z]/, letter => letter.toUpperCase())
      .replace(/-[a-z]/g, match => match.charAt(1).toUpperCase());

    const content = controllerSpecFile.content;
    const test = specAnalyser.analyse(content);

    if (!test) return '';

    const code = await generator.generate(componentName, test);

    const list = this.explanationGenerator.create('unordered-list', 'Generate spec', 4);

    this.currentExplanation!.insert(list);

    list.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Insert ',
          { type: 'inline-code', content: 'let compiled = fixture.nativeElement;' },
          ' in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'inline-code', content: '$scope.$digest();' },
          ' in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'inline-code', content: 'compile' },
          ' calls in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace ',
          { type: 'inline-code', content: '$scope' },
          ' and ',
          { type: 'inline-code', content: 'directive' },
          ' by ',
          { type: 'inline-code', content: 'component' },
          ' in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace ',
          { type: 'inline-code', content: 'component.find' },
          ' by ',
          { type: 'inline-code', content: 'compiled.querySelectorAll' },
          ' in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'inline-code', content: 'var component = ...;' },
          ' in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Insert ',
          { type: 'inline-code', content: 'fixture.detectChanges();' },
          ' before ',
          { type: 'inline-code', content: 'expect' },
          ' calls in ',
          { type: 'inline-code', content: 'it() and xit()' }
        )
      )
    )

    if (Config.i18n.generate) {

      list.insert(
        this.explanationGenerator.create('line', `Insert TranslateModule code`)!,
        this.explanationGenerator.create('line', `Insert HttpLoaderFactory code`)!,
        this.explanationGenerator.create('line', `Insert TranslateService code`)!
      );
    }

    const todoList = this.explanationGenerator.create('unordered-list', 'Spec file generation', 4);

    this.todoCurrentExplanation!.insert(todoList);

    todoList.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Check commented code (unmigrated code)'
      ),
      this.explanationGenerator.create('unchecked-checkbox', 'Add component import'
      )
    )

    return code;
  }

  async launch(): Promise<any> {
    const finder = new FilesFinder();

    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Import new components in app.module.ts'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for external libraries (like lodash) uses'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for unmigrated code outside of functions'),
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Migrate $ injections in constructor to Angular injections, otherwise it will cause an ',
          { type: 'inline-code', content: 'Can\'t resolve all parameters for' },
          ' error'
        )
      ),
      this.explanationGenerator.create('unchecked-checkbox', 'If you use new demo component, create a new route in app.module.ts and remove component from AngularJS router'),
      this.explanationGenerator.create('unchecked-checkbox', 'Update styles to import variables (you no longer have one css file)'),
    )

    let files: File[] = [];
    for (const path of Config.controllers.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSControllers(path)
        ]
      }
    }

    for (const file of files) {
      await this.getControllerCode(file);
    }
  }

}
