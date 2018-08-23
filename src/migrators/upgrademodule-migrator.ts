import colors from 'colors';
import fs from 'fs-extra-promise';
import glob from 'glob-promise';
import path from 'path';
import { Config } from '../../config/config';
import { NpmInstallator } from '../utils/npm-installator';
import { DataExtractor } from './../utils/data-extractor';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';
import { Migrator } from "./migrator";


export class UpgradeModuleMigrator extends Migrator {

  private readonly dependencies = [
    '@angular/upgrade'
  ]

  private readonly i18nDependencies = [
    '@ngx-translate/core',
    '@ngx-translate/http-loader'
  ]

  constructor(verbose = true) {
    super(verbose, '[UPGRADE MODULE MIGRATOR]', colors.magenta);
  }

  private installDependencies(): Promise<any> {
    return new Promise((resolve, reject) => {
      const installator = new NpmInstallator();
      const dependencies = Config.i18n.generate
        ? this.dependencies.concat(this.i18nDependencies)
        : this.dependencies;

      if (!Config.noInstall) {
        if (this.verbose) this.log('Installing UpgradeModule dependencies');

        installator.installOneByOne(dependencies, {
          cwd: Config.projectFolder,
          saveDev: true,
          verbose: Config.npmVerbose
        })
          .then(_ => {
            if (this.verbose) this.log('UpgradeModule dependencies installed');

            const list = this.explanationGenerator.create('unordered-list', `Install UpgradeModule dependency`, 2)!

            for (const dependency of dependencies) {
              list.insert(
                this.explanationGenerator.create('line', `Install ${dependency} dev dependency`)!

              )
            }

            this.doneExplanations.insert(list);

            resolve();
          })
          .catch(err => reject(err));
      } else {
        installator.writeToPackageJson(`${Config.projectFolder}/package.json`, dependencies, { saveDev: true, verbose: Config.npmVerbose })
          .then(() => {
            if (this.verbose) this.log('UpgradeModule dependencies saved to package.json');

            const list = this.explanationGenerator.create('unordered-list', `Save UpgradeModule dependency to package.json`, 2)!

            for (const dependency of dependencies) {
              list.insert(
                this.explanationGenerator.create('line', `Save ${dependency} dev dependency`)!

              )
            }

            this.doneExplanations.insert(list);

            this.todoExplanations.insert(
              this.explanationGenerator.create('unchecked-checkbox', `Run \`npm i\``)!
            );

            resolve();
          })
          .catch(err => reject(err));
      }
    });
  }

  private createModule(): Promise<any> {
    const samplePath = path.join(RootPath.path, './samples/app.module.sample.ts');
    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath)
        .then(data => {
          let content = data.toString();

          content = this.getRoutingCode(content, Config.routing.routes);

          if (Config.routing.generate) {
            this.todoExplanations.insert(
              this.explanationGenerator.create('unchecked-checkbox', this.explanationGenerator.buildMarkdown(
                'Add ',
                { type: 'inline-code', content: '<router-outlet></router-outlet>' },
                ' to app component for routing'
              )),
              this.explanationGenerator.create('unchecked-checkbox', this.explanationGenerator.buildMarkdown(
                'Update  ',
                { type: 'inline-code', content: 'href' },
                ' on ',
                { type: 'inline-code', content: '<a>' },
                ' to ',
                { type: 'inline-code', content: '[routerLink]' }
              ))
            )
          }

          content = this.getModulei18nCode(content);

          const remover = new DataRemover();
          content = remover.removeEmptyLines(content);

          fs.writeFileAsync(`${Config.srcFolder}/app.module.ts`, content)
            .then(() => {
              if (this.verbose) this.log(`${Config.srcFolder}/app.module.ts created`, colors.green);

              this.doneExplanations.insert(
                this.explanationGenerator.create('line', `Create ${Config.srcFolder}/app.module.ts`)!
              );
              resolve();
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  private getRoutingCode(appModuleCode: string, routes: { path: string, component: any }[]): string {
    const routingExp = new RegExp('\/\/ ROUTING([\n|\r].*?)*\/\/ END ROUTING', 'g');
    const routingMatches = appModuleCode.match(routingExp) || [];
    for (const match of routingMatches) {
      let code = Config.routing.generate ?
        match
          .replace('// ROUTING', '')
          .replace('// END ROUTING', '')
          .replace(/\/\/\s/g, '')
        : '';
      appModuleCode = appModuleCode.replace(match, code);
    }

    const list = this.explanationGenerator.create('unordered-list', `RouterModule`, 2)!

    list.insert(
      this.explanationGenerator.create('line', `Inserted RouterModule code in ${Config.srcFolder}/app.module.ts`)!,
      this.explanationGenerator.create('line', `Inserted routes code in ${Config.srcFolder}/app.module.ts`)!,
      this.explanationGenerator.create('line', `Inserted handling strategy code in ${Config.srcFolder}/app.module.ts`)!
    );

    this.doneExplanations.insert(list);

    appModuleCode = appModuleCode
      .replace('$routes', this.getRoutesCode(routes))
      .replace('$urlStartsWith', this.getHandlingStrategyCode(routes))
    return appModuleCode;
  }

  private getRoutesCode(routes: { path: string, component: any }[]): string {
    let stringRoutes = JSON.stringify(routes, null, 2);
    const componentsExp = /"component":.*?\n/g;
    const matches = stringRoutes.match(componentsExp) || [];
    for (const match of matches) {
      let splited = match.split(':');
      splited[1] = splited[1].replace(/"/g, '');
      let joined = splited.join(':');
      stringRoutes = stringRoutes.replace(match, joined);
    }

    return stringRoutes;
  }

  private getHandlingStrategyCode(routes: { path: string, component: any }[]): string {
    let code = 'false';

    if (routes.length > 0) {
      code = '';
      routes.forEach((value, index) => {
        code += `url.toString().startsWith("${value.path}")`
        if (index < routes.length - 1) {
          code += ' || ';
        }
      })
    }

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
      this.explanationGenerator.create('line', `Insert TranslateModule code in ${Config.srcFolder}/app.module.ts`)!,
      this.explanationGenerator.create('line', `Insert HttpLoaderFactory code in ${Config.srcFolder}/app.module.ts`)!,
      this.explanationGenerator.create('line', `Insert TranslateService code in ${Config.srcFolder}/app.component.ts`)!
    );

    this.doneExplanations.insert(list);

    return appModuleCode;
  }

  private async updatei18nFiles() {
    if (!Config.i18n.files.length) return;

    let files: string[] = [];
    for (const file of Config.i18n.files) {
      files = [
        ...files,
        ...await glob(file)
      ]
    }

    let newPaths: string[] = []

    if (Config.i18n.keywordsToRemove.length) {
      const toRemove = new RegExp(`(${Config.i18n.keywordsToRemove.join('|')})`, 'g');
      newPaths = files.map(path => path.replace(toRemove, ''));
    }

    const assetsPath = path.join(Config.srcFolder, './assets/i18n');

    await fs.mkdirp(assetsPath);

    const list = this.explanationGenerator.create('unordered-list', 'Move translations files', 4);

    this.doneExplanations.insert(list);

    files.forEach((path, index) => {
      const file = newPaths[index].split(/(\\|\/)/).pop();
      const newPath = `${assetsPath}/${file}`;
      fs.copy(path, newPath);
      this.log(`${newPath} created`);

      list.insert(
        this.explanationGenerator.create('chip', this.explanationGenerator.buildMarkdown(
          'Copied ',
          { type: 'inline-code', content: path },
          ' to ',
          { type: 'inline-code', content: newPath }
        ))
      )
    });
  }

  private createMain(): Promise<any> {
    const samplePath = path.join(RootPath.path, './samples/main.sample.ts');
    return new Promise((resolve, reject) => {
      fs.copyFile(samplePath, `${Config.srcFolder}/main.ts`, err => {
        if (err) {
          reject(err)
        } else {
          if (this.verbose) this.log(`${Config.srcFolder}/main.ts created`, colors.green);

          this.doneExplanations.insert(
            this.explanationGenerator.create('line', `Create ${Config.srcFolder}/main.ts`)!
          );
          resolve();
        }
      })
    });
  }


  private updateIndexFile(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(`${Config.srcFolder}/index.html`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const remover = new DataRemover();
          const extractor = new DataExtractor();
          let content = data.toString();
          content = remover.removeHTMLAttribute(content, 'ng-app');
          content = remover.removeHTMLAttribute(content, 'ng-strict-di');

          const list = this.explanationGenerator.create('unordered-list', `Update index.html`, 2)!

          list.insert(
            this.explanationGenerator.create('line',
              this.explanationGenerator.buildMarkdown(
                { type: 'text', content: 'Remove ' },
                { type: 'inline-code', content: 'ng-app' },
                { type: 'text', content: ' and ' },
                { type: 'inline-code', content: 'ng-strict-di' }
              )
            )
          );

          const tag = extractor.extractTagWithAttribute(content, 'div', 'ng-view', '');

          if (tag.length) {
            const selector = Config.appComponentSelector;
            content = content.replace(tag[0], `<${selector}></${selector}>`);
            list.insert(
              this.explanationGenerator.create('line',
                this.explanationGenerator.buildMarkdown(
                  { type: 'text', content: 'Replace ' },
                  { type: 'inline-code', content: '<div ng-view>' },
                  { type: 'text', content: ' by ' },
                  { type: 'inline-code', content: `<${selector}></${selector}>` }
                )
              )
            );
          }

          this.doneExplanations.insert(list);

          fs.writeFile(`${Config.srcFolder}/index.html`, content, err => {
            if (err) {
              reject(err);
            } else {
              if (this.verbose) this.log(`${Config.srcFolder}/index.html updated`)
              resolve();
            }
          })
        }
      })
    });
  }

  private createAppComponent(): Promise<any> {
    const samplePath = path.join(RootPath.path, './samples/app.component.sample.ts');
    return new Promise((resolve, reject) => {
      fs.readFileAsync(samplePath)
        .then(data => {
          let content = data
            .toString()
            .replace('$appComponentSelector', Config.appComponentSelector)
            .replace(/\$moduleName/, Config.moduleName);

          content = this.getAppComponenti18nCode(content);
          const remover = new DataRemover();
          content = remover.removeEmptyLines(content);



          fs.writeFileAsync(`${Config.srcFolder}/app.component.ts`, content)
            .then(() => {
              if (this.verbose) this.log(`${Config.srcFolder}/app.component.ts created`)

              this.doneExplanations.insert(
                this.explanationGenerator.create('line', `Create ${Config.srcFolder}/app.component.ts`)!
              )
              resolve();
            })
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  private getAppComponenti18nCode(appComponentCode: string): string {
    const i18nExp = new RegExp('\/\/ I18N([\n\r].*?)*\/\/ END I18N[\n\r]?', 'g');
    const i18nMatches = appComponentCode.match(i18nExp) || [];
    for (const match of i18nMatches) {
      let code = Config.i18n.generate ?
        match
          .replace(/\/\/ I18N[\n\r]?/, '')
          .replace(/\/\/ END I18N[\n\r]?/, '')
          .replace(/\/\/\s/g, '')
        : '';
      appComponentCode = appComponentCode.replace(match, code);
    }

    appComponentCode = appComponentCode.replace('$i18nDefaultLanguage', Config.i18n.defaultLanguage);

    return appComponentCode;
  }


  async launch(): Promise<any> {
    this.createModule()
      .catch(err => this.log(err, colors.red));

    this.createMain()
      .catch(err => this.log(err, colors.red));

    this.updateIndexFile()
      .catch(err => this.log(err, colors.red));

    this.createAppComponent()
      .catch(err => this.log(err, colors.red))

    if (Config.i18n.generate) {
      this.updatei18nFiles()
        .catch(err => this.log(err, colors.red))
    }

    await this.installDependencies()
      .catch(err => this.log(err, colors.red));
  }
}
