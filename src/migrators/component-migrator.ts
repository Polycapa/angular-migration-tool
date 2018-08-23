import colors from 'colors';
import fs from 'fs-extra-promise';
import path from 'path';
import { ComponentAnalyser } from '../analysers/component-analyser';
import { UnitTestAnalyser } from '../analysers/unit-test-analyser';
import { GeneratedContent } from '../explainer/models/generated-content';
import { Config } from './../../config/config';
import { AngularJSComponentAnalyser } from './../analysers/angularjs-component-analyser';
import { ControllerAnalyser } from './../analysers/controller-analyser';
import { Component } from './../analysers/models/component';
import { Controller } from './../analysers/models/controller';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { Path } from './../files/models/path';
import { ComponentGenerator } from './../generators/component-generator';
import { SpecGenerator } from './../generators/spec-generator';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';
import { ComponentToAngular } from './component-to-angular';
import { Migrator } from "./migrator";


export class ComponentMigrator extends Migrator {
  private currentExplanation: GeneratedContent | undefined;
  private todoCurrentExplanation: GeneratedContent | undefined;

  constructor(verbose = true) {
    super(verbose, '[COMPONENT TO ANGULAR]');
  }

  private async getComponentCode(file: File) {
    const finder = new FilesFinder();
    const angularJSComponentAnalyser = new AngularJSComponentAnalyser();
    const controllerAnalyser = new ControllerAnalyser();
    const componentAnalyser = new ComponentAnalyser();
    const mover = new ComponentToAngular();

    let key = file.path.key;

    const angularJSComponentPath = file.path;
    const { controller: controllerFile, template: templateFile, componentSpec: componentSpecFile, controllerSpec: controllerSpecFile, demoTemplate: demoTemplateSpec } = await finder.findAngularJSComponentRelatedFiles(file);

    let angularJSComponentContent = '';
    try {
      angularJSComponentContent = file.content;
    } catch (e) {
      this.log(e, colors.red);
      return;
    }
    let controllerContent = '';

    try {
      controllerContent = controllerFile!.content;
    } catch (e) {
      this.log(`Cannot find controller file for ${file.toString()}`, colors.red);
    }

    const angularJSComponent = angularJSComponentAnalyser.analyse(angularJSComponentContent);
    const controller = controllerAnalyser.analyse(controllerContent);
    const component = componentAnalyser.analyse(angularJSComponent, controller);

    this.currentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${component.name}`, 2)

    this.todoCurrentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${component.name}`, 2);

    this.doneExplanations.insert(this.currentExplanation);
    this.todoExplanations.insert(this.todoCurrentExplanation);

    const angularJSComponentList = this.explanationGenerator.create('unordered-list', `Extract component from ${angularJSComponentPath}`, 4);

    this.currentExplanation.insert(angularJSComponentList);

    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Import ',
          { type: 'bold', content: component.name },
          ' in app.module.ts ',
          { type: 'inline-code', content: 'declarations' },
          ' and ',
          { type: 'inline-code', content: 'entryComponents' }
        )
      )
    )

    angularJSComponentList.insert(
      this.explanationGenerator.create('chip', `Extract component name : ${angularJSComponent.name}`),
      this.explanationGenerator.create('chip', `Extract template url : ${angularJSComponent.templateUrl}`),
      this.explanationGenerator.create('chip', `Extract controller name : ${angularJSComponent.controller}`),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract bindings : ',
          { type: 'inline-code', content: angularJSComponent.bindings }
        )
      )
    )

    if (controllerFile) {
      const controllerList = this.explanationGenerator.create('unordered-list', `Extract controller from ${controllerFile.toString()}`, 4);

      this.currentExplanation.insert(controllerList);

      controllerList.insert(
        this.explanationGenerator.create('chip', `Extract controller name : ${controller.name}`),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            `Extract controller body : `,
            { type: 'code', content: controller.body }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            `Extract controller injections : `,
            { type: 'inline-code', content: JSON.stringify(controller.inject) }
          )
        )
      )

      const componentList = this.explanationGenerator.create('unordered-list', `Extract angular component from ${angularJSComponentPath} and ${controllerFile.toString()}`, 4);

      this.currentExplanation.insert(componentList);

      componentList.insert(
        this.explanationGenerator.create('chip', `Extract component name : ${component.name}`),
        this.explanationGenerator.create('chip', `Extract template url : ${component.templateUrl}`),
        this.explanationGenerator.create('chip', `Extract style url : ${component.styleUrl}`),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract inputs from bindings : ',
            { type: 'code', content: JSON.stringify(component.inputs, null, 2) }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract properties from ctrl, this and global variables : ',
            { type: 'code', content: JSON.stringify(component.properties, null, 2) }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract functions from ctrl or this functions : ',
            { type: 'code', content: JSON.stringify(component.functions, null, 2) }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract injections : ',
            { type: 'code', content: JSON.stringify(component.injections, null, 2) }
          )
        )
      )
    }

    const code = await mover.move(angularJSComponent, controller);

    const componentCodeList = this.explanationGenerator.create('unordered-list', `Generate component code`, 4);

    this.currentExplanation.insert(componentCodeList);

    componentCodeList.insert(
      this.explanationGenerator.create('chip', `Insert selector`),
      this.explanationGenerator.create('chip', `Insert inputs (public)`),
      this.explanationGenerator.create('chip', `Insert properties (private)`),
      this.explanationGenerator.create('chip', `Insert injections as constructor parameters (private)`),
      this.explanationGenerator.create('chip', `Insert functions (public), convert all functions in their body to arrow functions and insert function comments`),
      this.explanationGenerator.create('chip', `Set all functions parameters type to any`),
      this.explanationGenerator.create('chip', `Add this reference to inputs, properties and injections calls`)
    )

    if (Config.components.downgrade) {
      componentCodeList.insert(
        this.explanationGenerator.create('chip', `Insert UpgradeModule downgrade code`),
      )
    }

    let log = this.createLog(`${key.toUpperCase()} ANGULAR COMPONENT`, code);

    if (!Config.components.generatedFilesFolder) return;

    // Generate folders
    const exist = fs.existsSync(Config.components.generatedFilesFolder);

    if (!exist) {
      fs.mkdirsSync(Config.components.generatedFilesFolder);
    }

    try {
      fs.mkdirsSync(`${Config.components.generatedFilesFolder}/${key}`)
    } catch (err) {
      throw err;
    }

    // Generate component
    this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.component.ts`, code);

    const moduleCode = await this.generateModuleCode(key, controller);

    this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.module.ts`, moduleCode);

    const pathWithoutFilename = file.path.withoutFilename();

    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Move ',
          { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.component.ts` },
          ' to ',
          { type: 'bold', content: `${pathWithoutFilename}/${key}.component.ts` }
        )
      )
    )

    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'bold', content: `${pathWithoutFilename}/${key}.component.js` },
          ' file and its references from ',
          { type: 'inline-code', content: `${Config.projectFolder}/angular.json` }
        )
      )
    )
    this.todoCurrentExplanation.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'bold', content: `${pathWithoutFilename}/${key}.controller.js` },
          ' file and its references from ',
          { type: 'inline-code', content: `${Config.projectFolder}/angular.json` }
        )
      )
    )

    // Generate component template
    if (templateFile) {
      const templateCode = await this.generateTemplateCode(templateFile);
      log += this.createLog(`${key.toUpperCase()} ANGULAR TEMPLATE`, templateCode);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.template.html`, templateCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.template.html` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.template.html` }
          )
        )
      )
    }

    // Generate demo component template for AngularJS use
    if (demoTemplateSpec) {
      const demoCode = await this.generateDemoCode(demoTemplateSpec, component);
      log += this.createLog(`${key.toUpperCase()} ANGULAR DEMO`, demoCode);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.html`, demoCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.html` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.demo.html` }
          )
        )
      )
    }

    // Generate demo component template
    if (demoTemplateSpec) {
      const angularDemoCode = await this.generateAngularDemoCode(demoTemplateSpec, component);
      log += this.createLog(`${key.toUpperCase()} ANGULAR DEMO COMPONENT TEMPLATE`, angularDemoCode);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.component.html`, angularDemoCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.component.html` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.demo.component.html` }
          )
        )
      )
    }

    // Generate demo component
    try {
      const angularDemoComponentCode = await this.generateDemoComponentCode(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.component.html`, key, component);
      log += this.createLog(`${key.toUpperCase()} ANGULAR DEMO COMPONENT`, angularDemoComponentCode);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.component.ts`, angularDemoComponentCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.demo.component.ts` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.demo.component.ts` }
          )
        )
      )
    } catch (e) {
      this.log(e, colors.red)
    }

    // Generate spec file
    if (componentSpecFile) {
      const unitTest = await this.generateSpecCode(componentSpecFile);
      log += this.createLog(`${key.toUpperCase()} ANGULAR COMPONENT SPEC`, unitTest);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.component.spec.ts`, unitTest);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.component.spec.ts` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.component.spec.ts` }
          )
        )
      )
    }

    // Generate second spec file
    if (controllerSpecFile) {
      const unitTest = await this.generateSpecCode(controllerSpecFile);
      log += this.createLog(`${key.toUpperCase()} ANGULAR CONTROLLER SPEC`, unitTest);
      this.createFile(`${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.controller.spec.ts`, unitTest);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.components.generatedFilesFolder}/${key}/${key}${Config.components.generatedPrefix}.controller.spec.ts` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.controller.spec.ts` }
          )
        )
      )
    }

    if (Config.components.output) {
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

  private async generateDemoCode(demoFile: File, component: Component): Promise<any> {
    let content = demoFile.content;
    const bindingsExp = new RegExp(`(?!{).*?[,|}]`, 'g');

    if (component.inputs) {
      const list = this.explanationGenerator.create('unordered-list', 'Generate demo code', 4);

      this.currentExplanation!.insert(list);

      for (const input of component.inputs) {
        const camelCase = input.name
          .replace(/(^[A-Z])/, (first) => first.toLowerCase())
          .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`)
        const inputExp = new RegExp(input.name, 'g');
        const camelInputExp = new RegExp(camelCase, 'g');
        content = content
          .replace(inputExp, `${input.name}`)
          .replace(camelInputExp, `[${camelCase}]`);

        list.insert(
          this.explanationGenerator.create('chip',
            this.explanationGenerator.buildMarkdown(
              'Replace ',
              { type: 'inline-code', content: camelCase },
              ' by ',
              { type: 'inline-code', content: `[${camelCase}]` }
            )
          )
        )
      }
    }
    return content;
  }

  private async generateAngularDemoCode(demoFile: File, component: Component): Promise<any> {
    let content = demoFile.content;

    const list = this.explanationGenerator.create('unordered-list', 'Generate Angular demo template code', 4);
    this.currentExplanation!.insert(list);

    if (component.inputs) {

      for (const input of component.inputs) {
        const camelCase = input.name
          .replace(/(^[A-Z])/, (first) => first.toLowerCase())
          .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`)
        const inputExp = new RegExp(input.name, 'g');
        const camelInputExp = new RegExp(camelCase, 'g');
        content = content
          .replace(inputExp, `${input.name}`)
          .replace(camelInputExp, `[${input.name}]`);

        list.insert(
          this.explanationGenerator.create('chip',
            this.explanationGenerator.buildMarkdown(
              'Replace ',
              { type: 'inline-code', content: camelCase },
              ' by ',
              { type: 'inline-code', content: `[${input.name}]` }
            )
          )
        )
      }
    }

    content = content.replace(/\$resolve\./g, '');
    list.insert(
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'inline-code', content: '$resolve.' }
        )
      )
    )
    return content;
  }

  private generateDemoComponentCode(path: string, key: string, component: Component) {
    const demoPath = path.replace(/component/g, 'demo.component').replace(/\.js/, '.html');
    const componentName = `${key}DemoComponent`
      .replace(/^[a-z]/, letter => letter.toUpperCase())
      .replace(/-[a-z]/g, match => match.charAt(1).toUpperCase());

    const list = this.explanationGenerator.create('unordered-list', 'Generate Angular demo component code', 4);
    this.currentExplanation!.insert(list);

    list.insert(
      this.explanationGenerator.create('chip', `Set name to ${componentName}`),
      this.explanationGenerator.create('chip', `Set selector to ${key}-demo`),
      this.explanationGenerator.create('chip', `Set properties to component inputs`),
      this.explanationGenerator.create('chip', `Set templateUrl to ${demoPath}`),
    )

    const demoComponent: Component = {
      name: `${component.name}Demo`,
      selector: `${key}-demo`,
      properties: component.inputs,
      templateUrl: demoPath,
      todo: ''
    }

    const generator = new ComponentGenerator();
    return generator.generate(componentName, demoComponent);
  }

  private async generateSpecCode(componentSpecFile: File): Promise<string> {
    const specAnalyser = new UnitTestAnalyser();
    const generator = new SpecGenerator();
    const key = componentSpecFile.path.key;
    const componentName = `${key}Component`
      .replace(/^[a-z]/, letter => letter.toUpperCase())
      .replace(/-[a-z]/g, match => match.charAt(1).toUpperCase());

    const content = componentSpecFile.content;
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
      .replace('$import', `import { ${componentName} } from './${key}${Config.components.generatedPrefix}.component';`)

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

  async launch() {
    const finder = new FilesFinder();

    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Import new components in app.module.ts'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for external libraries (like lodash) uses'),
      this.explanationGenerator.create('unchecked-checkbox', 'Look for unmigrated code outside of functions'),
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Migrate $ injections in constructor to Angular injections, otherwise it will cause an ',
          { type: 'inline-code', content: "Can't resolve all parameters for" },
          ' error'
        )
      ),
      this.explanationGenerator.create('unchecked-checkbox', 'If you use new demo component, create a new route in app.module.ts and remove component from AngularJS router'),
      this.explanationGenerator.create('unchecked-checkbox', 'Update styles to import variables (you no longer have one css file)'),
    )

    let files: File[] = [];
    for (const path of Config.components.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSComponents(path)
        ]
      }
    }

    for (const file of files) {
      await this.getComponentCode(file);
    }
  }
}
