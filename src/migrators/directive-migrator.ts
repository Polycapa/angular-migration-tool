import colors from "colors";
import fs from "fs-extra-promise";
import beautify from 'js-beautify';
import path from 'path';
import { GeneratedContent } from "../explainer/models/generated-content";
import { Path } from "../files/models/path";
import { Config } from './../../config/config';
import { AngularJSComponentAnalyser } from './../analysers/angularjs-component-analyser';
import { ComponentAnalyser } from './../analysers/component-analyser';
import { ControllerAnalyser } from './../analysers/controller-analyser';
import { DirectiveAnalyser } from './../analysers/directive-analyser';
import { AngularJSComponent } from './../analysers/models/angularjs-component';
import { Controller } from './../analysers/models/controller';
import { Directive } from './../analysers/models/directive';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { RootPath } from './../utils/root-path';
import { DirectiveToComponent } from './directive-to-component';
import { Migrator } from "./migrator";



export class DirectiveMigrator extends Migrator {
  private currentExplanation: GeneratedContent | undefined;
  private todoCurrentExplanation: GeneratedContent | undefined;

  constructor(verbose = true) {
    super(verbose, '[DIRECTIVE TO COMPONENT]');
  }

  private async getDirectiveCode(file: File) {
    const finder = new FilesFinder();
    const directiveAnalyser = new DirectiveAnalyser();
    const controllerAnalyser = new ControllerAnalyser();
    const mover = new DirectiveToComponent();

    const pathWithoutFilename = file.path.withoutFilename();
    let key = file.path.key;

    const { controller: controllerFile, template: templateFile, directiveSpec: directiveSpecFile, controllerSpec: controllerSpecFile, demoTemplate: demoTemplateFile } = await finder.findAngularJSDirectiveRelatedFiles(file);

    let directiveContent = '';
    try {
      directiveContent = file.content;
    } catch (e) { }
    let controllerContent = '';
    try {
      controllerContent = controllerFile!.content;
    } catch (e) { }

    const directive = directiveAnalyser.analyse(directiveContent);

    this.currentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${directive.name}`, 2)

    this.todoCurrentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${directive.name}`, 2);

    this.doneExplanations.insert(this.currentExplanation);
    this.todoExplanations.insert(this.todoCurrentExplanation);

    const directiveList = this.explanationGenerator.create('unordered-list', `Extract directive from ${file.path}`, 4);

    this.currentExplanation.insert(directiveList);

    directiveList.insert(
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
      )
    )

    const controller = controllerAnalyser.analyse(controllerContent);

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
    }

    const codes = mover.move(directive, controller);

    const componentCodeList = this.explanationGenerator.create('unordered-list', `Generate component code`, 4);

    this.currentExplanation.insert(componentCodeList);

    componentCodeList.insert(
      this.explanationGenerator.create('chip', `Insert module name`),
      this.explanationGenerator.create('chip', `Insert directive name as component name`),
      this.explanationGenerator.create('chip', `Insert directive scope as component bindings`),
      this.explanationGenerator.create('chip', `Insert directive controller name as component controller name`)
    )

    const controllerCodeList = this.explanationGenerator.create('unordered-list', `Generate controller code`, 4);

    this.currentExplanation.insert(controllerCodeList);

    const injectionsList = this.explanationGenerator.create('unordered-list', 'Update injections', 6);

    injectionsList.insert(
      this.explanationGenerator.create('chip', 'Remove $scope reference'),
      this.explanationGenerator.create('chip', 'Remove bindings'),
      this.explanationGenerator.create('chip', 'Keep others $injections')
    )

    controllerCodeList.insert(
      injectionsList,
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Add this reference ',
          { type: 'inline-code', content: 'var ctrl = this;' },
          ' and replace ',
          { type: 'inline-code', content: '$scope' },
          ' by ',
          { type: 'inline-code', content: 'ctrl' },
        )
      )
    )

    if (Config.directives.updateRemovedInjectedBindings) {
      controllerCodeList.insert(
        this.explanationGenerator.create('chip', `Add ctrl reference to component bindings calls`)
      )
    } else {
      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox', `Look for ctrl reference for component bindings calls`)
      )
    }

    if (Config.directives.generateUndeclaredWarning) {
      controllerCodeList.insert(
        this.explanationGenerator.create('chip', `Add warnings for undeclared variables`)
      )
    } else {
      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox', `Look if variable are undeclared`)
      )
    }

    let log = this.createLog(`${key.toUpperCase()} COMPONENT`, codes.componentCode);

    log += this.createLog(`${key.toUpperCase()} CONTROLLER`, codes.controllerCode);


    if (Config.directives.generatedFilesFolder) {
      const exist = fs.existsSync(Config.directives.generatedFilesFolder);

      if (!exist) {
        fs.mkdirsSync(Config.directives.generatedFilesFolder);
      }

      try {
        fs.mkdirsSync(`${Config.directives.generatedFilesFolder}/${key}`)
      } catch (err) {

      }

      const generatedComponentPath = `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.component.js`;
      this.createFile(generatedComponentPath, codes.componentCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.component.js` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.component.js` }
          )
        )
      )

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Remove ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.directive.js` }
          )
        ),
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Replace ',
            { type: 'bold', content: `${key}.directive.js` },
            ' references from ',
            { type: 'inline-code', content: `${Config.projectFolder}/angular.json` },
            ' by ',
            {
              type: 'bold', content: `${key}.component.js`
            }
          )
        )
      )

      this.createFile(`${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.controller.js`, codes.controllerCode);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.controller.js` },
            ' to ',
            { type: 'bold', content: `${pathWithoutFilename}/${key}.controller.js` }
          )
        )
      )
    }

    if (Config.directives.routerConfig) {
      const routerCode = await this.generateRouterCode(controller, directive);
      log += this.createLog(`${key.toUpperCase()} ROUTER`, routerCode);
    }

    if (templateFile) {
      const templateCode = await this.generateTemplateCode(templateFile, directive, codes.controllerCode);

      log += this.createLog(`${key.toUpperCase()} TEMPLATE`, templateCode);
    }

    if (demoTemplateFile) {
      const demoCode = await this.generateDemoCode(demoTemplateFile, directive);

      log += this.createLog(`${key.toUpperCase()} DEMO`, demoCode);
    }

    try {
      const unitTestCodes = await this.generateUnitTestCode(controllerSpecFile, directiveSpecFile, controller, directive);

      log += this.createLog(`${key.toUpperCase()} CONTROLLER UNIT TEST`, unitTestCodes.controllerTest);
      log += this.createLog(`${key.toUpperCase()} COMPONENT UNIT TEST`, unitTestCodes.componentTest);

    } catch (e) {
      this.log(e, colors.red);
    }




    if (Config.directives.upgrade) {
      const angularJSComponentAnalyser = new AngularJSComponentAnalyser();
      const component = angularJSComponentAnalyser.analyse(codes.componentCode);
      const upgradeCode = await this.generateUpgradeCode(component, controllerAnalyser.analyse(codes.controllerCode));

      this.createFile(`${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.upgraded.component.ts`, upgradeCode);

      log += this.createLog(`${key.toUpperCase()} UPGRADE CODE`, upgradeCode);

    }

    if (Config.directives.output) {
      this.log(log);
    }

  }

  private generateRouterCode(controller: Controller, directive: Directive): Promise<any> {
    return new Promise((resolve, reject) => {
      const path = Config.directives.routerConfig;
      let key = path.substring(path.lastIndexOf('/') + 1);
      key = key.substring(0, key.indexOf('.js'));

      //Test if generated router config already exists
      fs.exists(`${Config.directives.generatedFilesFolder}/${key}${Config.directives.generatedPrefix}.js`, exist => {
        // If doesn't exist, take default file, else use it
        let routerConfig = exist ? `${Config.directives.generatedFilesFolder}/${key}${Config.directives.generatedPrefix}.js` : Config.directives.routerConfig;

        fs.readFile(routerConfig, (err, data) => {
          if (err) {
            reject(err);
          } else {
            const demoName = controller.name.replace(/Controller/, 'DemoController');

            const exp = new RegExp(`controller:\\s*'(${controller.name})?(${demoName})?',?`);

            const match = data.toString().match(exp);

            if (match) {
              const list = this.explanationGenerator.create('unordered-list', 'Generate router config', 4)
              this.currentExplanation!.insert(list);
              list.insert(
                this.explanationGenerator.create('chip',
                  this.explanationGenerator.buildMarkdown(
                    'Replace ',
                    { type: 'inline-code', content: match[0] },
                    ' by ',
                    { type: 'inline-code', content: `component: '${directive.name}',` },
                    ' in router config'
                  )
                )
              )
            }

            let code = data.toString().replace(exp, `component: '${directive.name}',`);

            fs.writeFile(`${Config.directives.generatedFilesFolder}/${key}${Config.directives.generatedPrefix}.js`, code, err => {
              if (err) {
                reject(err);
              } else {
                if (this.verbose) this.log(`${Config.directives.generatedFilesFolder}/${key}${Config.directives.generatedPrefix}.js created`, colors.green);
                resolve(code);
              }
            });

            this.todoCurrentExplanation!.insert(
              this.explanationGenerator.create('unchecked-checkbox',
                this.explanationGenerator.buildMarkdown(
                  'Move ',
                  { type: 'bold', content: `${Config.directives.generatedFilesFolder}/${key}${Config.directives.generatedPrefix}.js` },
                  ' to ',
                  { type: 'bold', content: Config.directives.routerConfig }
                )
              )
            )
          }
        })
      })
    });
  }

  private async generateTemplateCode(templateFile: File, directive: Directive, controllerCode: string): Promise<any> {
    let ctrlMembers: string[] = [];
    const templatePath = templateFile.path.value;
    const key = templateFile.path.key;

    const exp = new RegExp(`ctrl\\.\\w*?\\s`, 'g');

    const bindingsExp = new RegExp(`(?!{).*?[,|}]`, 'g');
    const bindingsMatches = directive.scope.match(bindingsExp) || [];
    for (const match of bindingsMatches) {
      const binding = match.split(':')[0].trim();
      ctrlMembers.push(binding);
    }

    const matches = controllerCode.match(exp);
    if (matches) {
      for (let match of matches) {
        match = match.trim().replace(/ctrl\./, '');
        if (match && ctrlMembers.indexOf(match) === -1) {
          ctrlMembers.push(match);
        };
      }

      let content = templateFile.content;

      const list = this.explanationGenerator.create('unordered-list', 'Generate template code', 4)

      this.currentExplanation!.insert(list);

      for (const member of ctrlMembers) {
        let memberExp = new RegExp(`${member}`, 'g');
        content = content.replace(memberExp, `$ctrl.${member}`)

        list.insert(
          this.explanationGenerator.create('chip',
            this.explanationGenerator.buildMarkdown(
              'Replace all instances of ',
              { type: 'inline-code', content: member },
              ' by ',
              { type: 'inline-code', content: `$ctrl.${member}` }
            )
          )
        )
      }

      const fileName = `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.template.html`;
      await this.createFile(fileName, content);

      this.todoCurrentExplanation!.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: fileName },
            ' to ',
            { type: 'bold', content: templatePath }
          )
        )
      )
      return content;
    }
  }

  private async generateUnitTestCode(controllerSpecFile: File | undefined, directiveSpecFile: File | undefined, controller: Controller, directive: Directive): Promise<{ controllerTest: string, componentTest: string }> {

    const key = directiveSpecFile ? directiveSpecFile.path.key : controllerSpecFile ? controllerSpecFile.path.key : '';

    const controllerExp = /\$controller/g;
    const directiveExp = /directive/g;
    const componentControllerExp = /^\s*\$componentController/gm;
    const controllerNameExp = new RegExp(controller.name, 'g');

    const list = this.explanationGenerator.create('unordered-list', 'Generate unit tests', 4);

    this.currentExplanation!.insert(list);

    let controllerTestContent = '', directiveTestContent = '';

    if (controllerSpecFile) {
      controllerTestContent = controllerSpecFile.content
        .replace(controllerExp, '$componentController')
        .replace(controllerNameExp, directive.name)
        .replace(/\$scope\./g, 'ctrl.')
        .replace(directiveExp, 'component')
        .replace(componentControllerExp, 'var ctrl = $componentController')


      const controllerTestFilePath = `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.controller.spec.js`;

      list.insert(this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace all instances of ',
          { type: 'inline-code', content: '$controller' },
          ' by ',
          { type: 'inline-code', content: '$componentController' },
          ` in ${controllerSpecFile.toString()}`
        )
      ))

      this.todoCurrentExplanation!.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: controllerTestFilePath },
            ' to ',
            { type: 'bold', content: controllerSpecFile.toString() }
          )
        )
      )


      await this.createFile(controllerTestFilePath, controllerTestContent);
    }



    if (directiveSpecFile) {
      directiveTestContent = directiveSpecFile.content
        .replace(controllerExp, '$componentController')
        .replace(controllerNameExp, directive.name)
        .replace(/\$scope\./g, 'ctrl.')
        .replace(directiveExp, 'component')
        .replace(componentControllerExp, 'var ctrl = $componentController')

      const directiveTestFilePath = `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.component.spec.js`;

      list.insert(this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Replace all instances of ',
          { type: 'inline-code', content: 'directive' },
          ' by ',
          { type: 'inline-code', content: 'component' },
          ` in ${directiveSpecFile.toString()}`
        )
      ))

      await this.createFile(directiveTestFilePath, directiveTestContent);

      this.todoCurrentExplanation!.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: directiveTestFilePath },
            ' to ',
            { type: 'bold', content: directiveSpecFile.toString().replace('directive', 'component') }
          )
        )
      )
      this.todoCurrentExplanation!.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Remove ',
            { type: 'bold', content: directiveSpecFile.toString() }
          )
        )
      )
    }

    return {
      controllerTest: controllerTestContent,
      componentTest: directiveTestContent
    }
  }

  private async generateDemoCode(demoFile: File, directive: Directive): Promise<string> {
    const demoPath = demoFile.path.value;
    const key = demoFile.path.key;
    const demoGeneratedFilePath = `${Config.directives.generatedFilesFolder}/${key}/${key}${Config.directives.generatedPrefix}.demo.html`;

    const list = this.explanationGenerator.create('unordered-list', 'Generate demo code', 4);

    this.currentExplanation!.insert(list);

    let content = demoFile.content;
    const bindingsExp = new RegExp(`(?!{).*?[,|}]`, 'g');
    const matches = directive.scope.match(bindingsExp);
    if (matches) {
      for (const match of matches) {
        const binding = match.split(':')[0];
        const bindingExp = new RegExp(binding, 'g');
        content = content.replace(bindingExp, `$resolve.${binding}`);

        list.insert(
          this.explanationGenerator.create('chip',
            this.explanationGenerator.buildMarkdown(
              'Replace all instances of ',
              { type: 'inline-code', content: binding },
              ' by ',
              { type: 'inline-code', content: `$resolve.${binding}` }
            ))
        )
      }
    }

    await this.createFile(demoGeneratedFilePath, content);

    this.todoCurrentExplanation!.insert(
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Move ',
          { type: 'bold', content: demoGeneratedFilePath },
          ' to ',
          { type: 'bold', content: demoPath }
        )
      )
    )

    return content;
  }

  private generateUpgradeCode(component: AngularJSComponent, controller: Controller): Promise<any> {
    return new Promise((resolve, reject) => {
      const angularComponentAnalyser = new ComponentAnalyser();
      const angularComponent = angularComponentAnalyser.analyse(component, controller);

      const samplePath = path.join(RootPath.path, './samples/upgraded-component.sample.ts');

      fs.readFileAsync(samplePath)
        .then(data => {
          const componentClass = controller.name.replace('Controller', 'Component');
          let content = data.toString();
          let inputs = '';
          if (angularComponent.inputs) {
            for (const input of angularComponent.inputs) {
              inputs += `@Input() ${input.name}: ${input.type}${input.value ? ` = ${input.value}` : ''};\n`
            }
          }

          this.currentExplanation!.insert(
            this.explanationGenerator.create('chip', `Generate component ${componentClass} for UpgradeModule`)
          )

          content = content
            .replace('$selector', angularComponent.selector)
            .replace('$componentClass', componentClass)
            .replace('$inputs', inputs)
            .replace('$componentName', component.name);
          content = beautify(content);
          resolve(content);
        })
        .catch(err => reject(err));
    });

  }

  async launch(): Promise<any> {
    const finder = new FilesFinder();

    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', `Look for external libraries (like lodash) uses`),
      this.explanationGenerator.create('unchecked-checkbox', `Look for code outside of functions`),
      this.explanationGenerator.create('unchecked-checkbox', `Look for scope events`)
    )

    let files: File[] = [];
    for (const path of Config.directives.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSTagDirectives(path)
        ]
      }
    }

    for (const file of files) {
      await this.getDirectiveCode(file);
    }
  }
}
