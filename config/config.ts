import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { RootPath } from './../src/utils/root-path';
import { ConfigFile } from './config-file';


export class Config {
  private static _config: ConfigFile;

  static init(): Promise<ConfigFile> {
    return new Promise((resolve, reject) => {
      let config: ConfigFile;

      const samplePath = path.join(RootPath.path, './samples/config.sample.json');

      try {
        config = JSON.parse(fs.readFileSync(samplePath).toString());
      } catch (e) {
        console.log(e);
        process.exit(1);
      }

      const questions = [
        {
          type: 'input',
          name: 'projectFolder',
          message: 'Migrated project folder',
          default: process.cwd()
        },
        {
          type: 'input',
          name: 'srcFolder',
          message: 'Migrated source folder',
          default: path.resolve(process.cwd(), './src')
        },
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name',
          default: process.cwd().split(/(\/|\\)/).pop()
        },
        {
          type: 'input',
          name: 'moduleName',
          message: 'Project module name'
        },
        {
          type: 'input',
          name: 'appComponentSelector',
          message: 'Main app component HTML selector (like my-app)'
        },
        {
          type: 'confirm',
          name: 'npmVerbose',
          message: 'Output NPM log',
          default: false
        },
        {
          type: 'input',
          name: 'migrationReadme',
          message: 'Migration readme file path',
          default: path.resolve(process.cwd(), './MIGRATION.md')
        },
        {
          type: 'input',
          name: 'tagDirectivesFolders',
          message: '(Tag Directives) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'directivesGeneratedFilesFolder',
          message: '(Tag Directives) Generated files folder',
          default: path.resolve(process.cwd(), './generated/components')
        },
        {
          type: 'input',
          name: 'directivesRouterConfig',
          message: '(Tag Directives) Router config file path'
        },
        {
          type: 'input',
          name: 'directivesGeneratedPrefix',
          message: '(Tag Directives) Generated files extension prefix',
          default: ''
        },
        {
          type: 'confirm',
          name: 'directivesGenerateUndeclaredWarning',
          message: '(Tag Directives) Generate undeclared var warning',
          default: true
        },
        {
          type: 'confirm',
          name: 'directivesUpdateRemovedInjectedBindings',
          message: '(Tag Directives) Update removed injected bindings',
          default: true
        },
        {
          type: 'confirm',
          name: 'directivesOutput',
          message: '(Tag Directives) Output generated code',
          default: false
        },
        {
          type: 'input',
          name: 'attributesDirectivesFolders',
          message: '(Attributes Directives) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'attributesDirectivesGeneratedFilesFolder',
          message: '(Attributes Directives) Generated files folder',
          default: path.resolve(process.cwd(), './generated/directives')
        },
        {
          type: 'input',
          name: 'attributesDirectivesGeneratedPrefix',
          message: '(Attributes Directives) Generated files extension prefix',
          default: ''
        },
        {
          type: 'confirm',
          name: 'attributesDirectivesGenerateUndeclaredWarning',
          message: '(Attributes Directives) Generate undeclared var warning',
          default: true
        },
        {
          type: 'confirm',
          name: 'attributesDirectivesUpdateRemovedInjectedBindings',
          message: '(Attributes Directives) Update removed injected bindings',
          default: true
        },
        {
          type: 'confirm',
          name: 'attributesDirectivesOutput',
          message: '(Attributes Directives) Output generated code',
          default: false
        },
        {
          type: 'input',
          name: 'componentsFolders',
          message: '(Components) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'componentsGeneratedFilesFolder',
          message: '(Components) Generated files folder',
          default: path.resolve(process.cwd(), './generated/angular')
        },
        {
          type: 'confirm',
          name: 'componentOutput',
          message: '(Components) Output generated code',
          default: false
        },
        {
          type: 'confirm',
          name: 'componentDowngrade',
          message: '(Components) Generate downgrade component code',
          default: false
        },
        {
          type: 'confirm',
          name: 'componentInjections',
          message: '(Components) Generate injections code',
          default: false
        },
        {
          type: 'input',
          name: 'componentsGeneratedPrefix',
          message: '(Components) Generated files extension prefix',
          default: ''
        },
        {
          type: 'input',
          name: 'servicesFolders',
          message: '(Services) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'servicesGeneratedFilesFolder',
          message: '(Services) Generated files folder',
          default: path.resolve(process.cwd(), './generated/services')
        },
        {
          type: 'confirm',
          name: 'servicesOutput',
          message: '(Services) Output generated code',
          default: false
        },
        {
          type: 'input',
          name: 'servicesGeneratedPrefix',
          message: '(Services) Generated files extension prefix',
          default: ''
        },
        {
          type: 'confirm',
          name: 'servicesInjections',
          message: '(Services) Generate injections code',
          default: false
        },
        {
          type: 'confirm',
          name: 'serviceDowngrade',
          message: '(Services) Generate downgrade service code',
          default: false
        },
        {
          type: 'input',
          name: 'filtersFolders',
          message: '(Filters) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'filtersGeneratedFilesFolder',
          message: '(Filters) Generated files folder',
          default: path.resolve(process.cwd(), './generated/pipes')
        },
        {
          type: 'confirm',
          name: 'filtersOutput',
          message: '(Filters) Output generated code',
          default: false
        },
        {
          type: 'input',
          name: 'filtersGeneratedPrefix',
          message: '(Filters) Generated files extension prefix',
          default: ''
        },
        {
          type: 'input',
          name: 'controllersFolders',
          message: '(AngularJS controllers) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'controllersGeneratedFilesFolder',
          message: '(AngularJS controllers) Generated files folder',
          default: path.resolve(process.cwd(), './generated/component')
        },
        {
          type: 'confirm',
          name: 'controllersOutput',
          message: '(AngularJS controllers) Output generated code',
          default: false
        },
        {
          type: 'input',
          name: 'controllersGeneratedPrefix',
          message: '(AngularJS controllers) Generated files extension prefix',
          default: ''
        },
        {
          type: 'input',
          name: 'constantsFolders',
          message: '(Constants) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'filtersGeneratedFile',
          message: '(Constants) Generated file path',
          default: path.resolve(process.cwd(), './generated/constants.ts')
        },
        {
          type: 'confirm',
          name: 'constantsOutput',
          message: '(Constants) Output generated code',
          default: false
        },
        {
          type: 'confirm',
          name: 'routingGeneration',
          message: '(Routing) Generate code',
          default: false
        },
        {
          type: 'confirm',
          name: 'i18nGeneration',
          message: '(i18n) Generate code',
          default: false
        },
        {
          type: 'input',
          name: 'i18nDefault',
          message: '(i18n) Default language',
          default: 'en'
        },
        {
          type: 'input',
          name: 'lintFolders',
          message: '(Lint) Files folders (separated by comma)'
        },
        {
          type: 'confirm',
          name: 'lintOutput',
          message: '(Lint) Output errors and fixes',
          default: true
        },
        {
          type: 'confirm',
          name: 'enableFix',
          message: '(Lint) Enable code fix',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoLint',
          message: '(Lint) Automate code lint',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoFix',
          message: '(Lint) Automate code fix',
          default: true
        },
        {
          type: 'input',
          name: 'lintLogFile',
          message: '(Lint) Log file path',
          default: path.resolve(process.cwd(), './lint.log.json')
        },
        {
          type: 'input',
          name: 'testSpecsFolders',
          message: '(Test) Files folders (separated by comma)'
        },
        {
          type: 'input',
          name: 'testIncludes',
          message: '(Test) Files to include (separated by comma)'
        },
        {
          type: 'confirm',
          name: 'testUpdatedReportFolders',
          message: '(Test) Update report folders to ./report',
          default: true
        },
        {
          type: 'confirm',
          name: 'testUpdatePolyfills',
          message: '(Test) Add ES6 imports to polyfills.ts',
          default: true
        }

      ]

      inquirer.prompt(questions)
        .then(async (answers: any) => {
          // General infos
          config.projectFolder = answers.projectFolder;
          config.srcFolder = answers.srcFolder;
          config.npmVerbose = answers.npmVerbose;

          // Project infos
          config.project.name = answers.projectName;
          config.project.moduleName = answers.moduleName;
          config.project.appComponentSelector = answers.appComponentSelector;
          config.project.migrationReadme = answers.migrationReadme;

          // Directives infos
          config.project.tagDirectives.generatedFilesFolder = answers.directivesGeneratedFilesFolder;
          config.project.tagDirectives.routerConfig = answers.directivesRouterConfig;
          config.project.tagDirectives.generateUndeclaredWarning = answers.directivesGenerateUndeclaredWarning;
          config.project.tagDirectives.updateRemovedInjectedBindings = answers.directivesUpdateRemovedInjectedBindings;
          config.project.tagDirectives.output = answers.directivesOutput;
          config.project.tagDirectives.generatedPrefix = answers.directivesGeneratedPrefix;
          config.project.tagDirectives.files = answers.tagDirectivesFolders ? answers.tagDirectivesFolders.split(',') : [];

          // Attributes directives infos
          config.project.attributeDirectives.generatedFilesFolder = answers.attributesDirectivesGeneratedFilesFolder;
          config.project.attributeDirectives.generateUndeclaredWarning = answers.attributesDirectivesGenerateUndeclaredWarning;
          config.project.attributeDirectives.updateRemovedInjectedBindings = answers.attributesDirectivesUpdateRemovedInjectedBindings;
          config.project.attributeDirectives.output = answers.attributesDirectivesOutput;
          config.project.attributeDirectives.generatedPrefix = answers.attributesDirectivesGeneratedPrefix;
          config.project.attributeDirectives.files = answers.attributeDirectivesFolders ? answers.attributeDirectivesFolders.split(',') : [];

          // Components infos
          config.project.components.generatedFilesFolder = answers.componentsGeneratedFilesFolder;
          config.project.components.output = answers.componentOutput;
          config.project.components.downgrade = answers.componentDowngrade;
          config.project.components.generatedPrefix = answers.componentsGeneratedPrefix;
          config.project.components.insertInjections = answers.componentInjections;
          config.project.components.files = answers.componentsFolders ? answers.componentsFolders.split(',') : [];

          // Services infos
          config.project.services.generatedFilesFolder = answers.servicesGeneratedFilesFolder;
          config.project.services.output = answers.servicesOutput;
          config.project.services.downgrade = answers.serviceDowngrade;
          config.project.services.generatedPrefix = answers.servicesGeneratedPrefix;
          config.project.services.insertInjections = answers.servicesInjections;
          config.project.services.files = answers.servicesFolders ? answers.servicesFolders.split(',') : [];

          // Filters infos
          config.project.filters.generatedFilesFolder = answers.filtersGeneratedFilesFolder;
          config.project.filters.output = answers.filtersOutput;
          config.project.filters.generatedPrefix = answers.filtersGeneratedPrefix;
          config.project.filters.files = answers.filtersFolders ? answers.filtersFolders.split(',') : [];

          // Controllers infos
          config.project.controllers.generatedFilesFolder = answers.controllersGeneratedFilesFolder;
          config.project.controllers.output = answers.controllersOutput;
          config.project.controllers.generatedPrefix = answers.controllersGeneratedPrefix;
          config.project.controllers.files = answers.controllersFolders ? answers.controllersFolders.split(',') : [];

          // Constants infos
          config.project.constants.generatedFile = answers.constantsGeneratedFile;
          config.project.constants.output = answers.constantsOutput;
          config.project.constants.files = answers.constantsFolders ? answers.constantsFolders.split(',') : [];

          // Routing infos
          config.project.routing.generate = answers.routingGeneration;

          // i18n infos
          config.project.i18n.generate = answers.i18nGeneration;
          config.project.i18n.defaultLanguage = answers.i18nDefault;

          // Lint infos
          config.project.lint.output = answers.lintOutput;
          config.project.lint.fix.enabled = answers.enableFix;
          config.project.lint.fix.auto.fixer = answers.autoFix;
          config.project.lint.fix.auto.linter = answers.autoLint;
          config.project.lint.logFile = answers.lintLogFile;
          config.project.lint.files = answers.lintFolders ? answers.lintFolders.split(',') : [];

          // Test infos
          config.project.tests.specsFolders = answers.testSpecsFolders.split(',');
          config.project.tests.testFilesToInclude = answers.testIncludes.split(',');
          config.project.tests.updateReportFolders = answers.testUpdatedReportFolders;
          config.project.tests.updatePolyfills = answers.testUpdatePolyfills;

          resolve(config);
        })

    });

  }

  static get projectFolder() {
    return this.config.projectFolder;
  }

  static get srcFolder() {
    return this.config.srcFolder;
  }

  static get projectName() {
    return this.config.project.name;
  }

  static get projectAssets() {
    return this.config.project.assets;
  }

  static get moduleName() {
    return this.config.project.moduleName;
  }

  static get appComponentSelector() {
    return this.config.project.appComponentSelector;
  }

  static get karmaConfig() {
    return this.config.project.karmaConfig;
  }

  static get migrationReadme() {
    return this.config.project.migrationReadme;
  }

  static get npmVerbose() {
    return this.config.npmVerbose;
  }

  static get noInstall() {
    return this.config.noInstall;
  }

  static get directives() {
    return this.config.project.tagDirectives;
  }

  static get attributeDirectives() {
    return this.config.project.attributeDirectives;
  }

  static get components() {
    return this.config.project.components;
  }

  static get services() {
    return this.config.project.services;
  }

  static get filters() {
    return this.config.project.filters;
  }

  static get controllers() {
    return this.config.project.controllers;
  }

  static get constants() {
    return this.config.project.constants;
  }

  static get routing() {
    return this.config.project.routing;
  }

  static get i18n() {
    return this.config.project.i18n;
  }

  static get noAngularJS() {
    return this.config.project.noAngularJS;
  }

  static get lint() {
    return this.config.project.lint;
  }

  static get tests() {
    return this.config.project.tests;
  }

  static get config() {
    return this._config;
  }

  static set(config: ConfigFile) {
    if (this.config) {
      return;
    } else if (config) {
      this._config = config;
    }
  }
}
