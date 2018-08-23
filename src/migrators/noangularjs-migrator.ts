import colors from 'colors';
import { GeneratedContent } from '../explainer/models/generated-content';
import { Config } from './../../config/config';
import { DataRemover } from './../utils/data-remover';
import { Migrator } from "./migrator";

export class NoAngularJSMigrator extends Migrator {
  constructor(verbose = true) {
    super(verbose, '[NO ANGULARJS MIGRATOR]');
  }

  private async updateCLIConfig() {
    const filePath = `${Config.projectFolder}/angular.json`;
    let config: any;
    try {
      let buffer: Buffer = await this.readFile(filePath);
      config = JSON.parse(buffer.toString());
    } catch (error) {
      this.log(error, colors.red);
      return;
    }

    if (Config.noAngularJS.toUpdate.styles) {
      this.updateCLIStyles(config);
    }

    if (Config.noAngularJS.toUpdate.scripts) {
      this.updateCLIScripts(config);
    }

    if (Config.noAngularJS.toUpdate.assets) {
      this.updateCLIAssets(config);
    }

    return this.createFile(filePath, JSON.stringify(config, null, 2));
  }

  private updateCLIStyles(config: any) {

    const list = this.explanationGenerator.create('unordered-list', 'Update CLI styles', 2);

    this.doneExplanations.insert(list);

    let array = this.removeItemsFromArray(config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .styles,
      Config.noAngularJS.keywordsToRemove,
      list
    );

    config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .styles = array;

    config
      .projects[Config.projectName]
      .architect
      .test
      .options
      .styles = array;
  }

  private updateCLIAssets(config: any) {
    const list = this.explanationGenerator.create('unordered-list', 'Update CLI assets', 2);

    this.doneExplanations.insert(list);

    let array = this.removeItemsFromArray(config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .assets,
      Config.noAngularJS.keywordsToRemove,
      list
    );

    config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .assets = array;

    config
      .projects[Config.projectName]
      .architect
      .test
      .options
      .assets = array;
  }

  private updateCLIScripts(config: any) {

    const list = this.explanationGenerator.create('unordered-list', 'Update CLI scripts', 2);

    this.doneExplanations.insert(list);

    let array = this.removeItemsFromArray(config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .scripts,
      Config.noAngularJS.keywordsToRemove,
      list
    );

    config
      .projects[Config.projectName]
      .architect
      .build
      .options
      .scripts = array;

    config
      .projects[Config.projectName]
      .architect
      .test
      .options
      .scripts = array;
  }

  private removeItemsFromArray(array: string[], keywordsToRemove: string[], explanation: GeneratedContent): string[] {
    return array.filter(el => {
      for (const keyword of keywordsToRemove) {
        if (el.indexOf(keyword) !== -1) {
          explanation.insert(
            this.explanationGenerator.create('chip', this.explanationGenerator.buildMarkdown(
              'Remove ',
              { type: 'inline-code', content: el }
            ))
          )
          return false;
        }
      }
      return true;
    })
  }

  private async removeUpgradeModule() {
    if (Config.noAngularJS.removeUpgradeModule) {
      const list = this.explanationGenerator.create('unordered-list', 'Remove UpgradeModule', 4);

      this.doneExplanations.insert(list);

      return Promise.all([
        this.updatePackageJSON(list),
        this.updateAppModule(list),
        this.updateAppComponent(list)
      ])
    }
  }

  private async updatePackageJSON(explanation: GeneratedContent) {
    const filePath = `${Config.projectFolder}/package.json`;
    let packageJSON: any;
    try {
      let buffer: Buffer = await this.readFile(filePath);
      packageJSON = JSON.parse(buffer.toString());
    } catch (error) {
      this.log(error, colors.red);
      return;
    }

    delete packageJSON.devDependencies['@angular/upgrade'];

    explanation.insert(
      this.explanationGenerator.create('chip', this.explanationGenerator.buildMarkdown(
        'Remove ',
        { type: 'inline-code', content: '@angular/upgrade' },
        'from package.json'
      ))
    )

    return this.createFile(filePath, JSON.stringify(packageJSON, null, 2));
  }

  private async updateAppModule(explanation: GeneratedContent) {
    const filePath = `${Config.srcFolder}/app.module.ts`;
    const remover = new DataRemover();
    let appModule: any;
    try {
      let buffer: Buffer = await this.readFile(filePath);
      appModule = buffer.toString();
    } catch (error) {
      this.log(error, colors.red);
      return;
    }

    appModule = appModule
      .replace(/import { UpgradeModule } from '@angular\/upgrade\/static';/, '')
      .replace(/UpgradeModule,/, '');

    explanation.insert(
      this.explanationGenerator.create('chip', 'Remove UpgradeModule import from app.module.ts')
    )

    appModule = remover.removeEmptyLines(appModule);

    return this.createFile(filePath, appModule);
  }

  private async updateAppComponent(explanation: GeneratedContent) {
    const filePath = `${Config.srcFolder}/app.component.ts`;
    const remover = new DataRemover();
    let component: any;
    try {
      let buffer: Buffer = await this.readFile(filePath);
      component = buffer.toString();
    } catch (error) {
      this.log(error, colors.red);
      return;
    }

    component = component
      .replace(/private upgrade: UpgradeModule,/, '')
      .replace(/import { UpgradeModule } from '@angular\/upgrade\/static';/, '')
      .replace(/this\.upgrade\.bootstrap\((.*\n?)*\);?/, '')
      .replace(/<div class="view-wrapper" ng-view=""><\/div>/, '');
    explanation.insert(
      this.explanationGenerator.create('chip', 'Remove UpgradeModule references from app.component.ts'),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Remove ',
          { type: 'inline-code', content: '<div ng-view>' },
          ' from app.component.ts'
        )
      )
    )

    component = remover.removeEmptyLines(component);

    return this.createFile(filePath, component);
  }


  async launch(): Promise<any> {
    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Update app component template')
    )
    await Promise.all([
      this.updateCLIConfig(),
      this.removeUpgradeModule()
    ])
  }
}
