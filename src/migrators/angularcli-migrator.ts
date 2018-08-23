import { exec } from 'child_process';
import colors from 'colors';
import fs from 'fs-extra-promise';
import glob from 'glob';
import { Config } from '../../config/config';
import { DataExtractor } from '../utils/data-extractor';
import { DataRemover } from '../utils/data-remover';
import { NpmInstallator } from '../utils/npm-installator';
import { Migrator } from "./migrator";

export class AngularCliMigrator extends Migrator {
  private readonly blankProjectName: string = Config.projectName;

  constructor(verbose = true) {
    super(verbose, '[ANGULAR CLI MIGRATOR]', colors.cyan);
  }

  /**
   * Install Angular CLI dependencies
   * 
   * @private
   * @returns {Promise<any>} Resolve when dependencies are installed
   * @memberof AngularCliMigrator
   */
  private installDependencies(): Promise<any> {
    return new Promise(async (resolve, reject) => {

      // Create blank project

      if (this.verbose) this.log('Installing Angular CLI dependencies');
      let dependencies: string[] = [];
      let devDependencies: string[] = [];
      try {
        const packageJsonData = await fs.readFileSync(`./${this.blankProjectName}/package.json`).toString();
        const packageJson = JSON.parse(packageJsonData);
        for (let key in packageJson.dependencies) {
          let s = `${key}@${packageJson.dependencies[key]}`;
          dependencies.push(s);
        }
        for (let key in packageJson.devDependencies) {
          let s = `${key}@${packageJson.devDependencies[key]}`;
          devDependencies.push(s);
        }
      } catch (error) {
        reject(error);
      }


      const installator = new NpmInstallator();

      if (!Config.noInstall) {
        installator.installOneByOne(dependencies, {
          cwd: Config.projectFolder,
          save: true,
          verbose: Config.npmVerbose
        })
          .then(_ => {
            installator.installOneByOne(devDependencies, {
              cwd: Config.projectFolder,
              saveDev: true,
              verbose: Config.npmVerbose
            })
              .then(_ => {
                if (this.verbose) this.log('Angular CLI dependencies installed');

                const list = this.explanationGenerator.create('unordered-list', 'Install Angular CLI dependencies', 2)!

                for (const dependency of dependencies) {
                  list.insert(
                    this.explanationGenerator.create('line', `Install ${dependency} dependency`)!
                  )
                }

                for (const dependency of devDependencies) {
                  list.insert(
                    this.explanationGenerator.create('line', `Install ${dependency} dev dependency`)!
                  )
                }

                this.doneExplanations.insert(list);

                resolve();
              })
              .catch(err => reject(err));
          })
          .catch(err => reject(err));
      } else {
        await installator.writeToPackageJson(`${Config.projectFolder}/package.json`, dependencies, { save: true, verbose: Config.npmVerbose })
        await installator.writeToPackageJson(`${Config.projectFolder}/package.json`, devDependencies, { saveDev: true, verbose: Config.npmVerbose });
        if (this.verbose) this.log('AngularCLI dependencies saved to package.json');

        const list = this.explanationGenerator.create('unordered-list', 'Save Angular CLI dependencies to package.json', 2)!

        for (const dependency of dependencies) {
          list.insert(
            this.explanationGenerator.create('line', `Save ${dependency} dependency`)!
          )
        }

        for (const dependency of devDependencies) {
          list.insert(
            this.explanationGenerator.create('line', `Save ${dependency} dev dependency`)!
          )
        }

        this.doneExplanations.insert(list);

        this.todoExplanations.insert(
          this.explanationGenerator.create('unchecked-checkbox', 'Run `npm i`')!
        )

        resolve();
      }
    });
  }

  /**
   * Generate an Angular project
   * 
   * @private
   * @returns {Promise<any>} Resolve when files are generated
   * @memberof AngularCliMigrator
   */
  private createAngularBlankProject(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (await this.angularJsonExist()) {
        await this.removeAngularJson();
      }

      if (await this.blankProjectExist()) {
        if (this.verbose) this.log('Blank Angular project already exists', colors.magenta);
        this.removeAngularBlankProject()
          .then(_ => {
            if (this.verbose) this.log('Creating blank Angular project');
            const cmd = exec(`ng new ${this.blankProjectName} --skip-install --skip-git`, err => {
              if (err) {
                reject(err);
              } else {
                if (this.verbose) this.log('Blank Angular project created');
                resolve();
              }
            })

            if (this.verbose) cmd.stdout.on('data', data => this.log(data.toString()))
            if (this.verbose) cmd.stderr.on('data', data => this.log(data.toString(), colors.red))
          })
      } else {
        if (this.verbose) this.log('Creating blank Angular project');
        const cmd = exec(`ng new ${this.blankProjectName} --skip-install --skip-git`, err => {
          if (err) {
            reject(err);
          } else {
            if (this.verbose) this.log('Blank Angular project created');
            resolve();
          }
        })

        if (this.verbose) cmd.stdout.on('data', data => this.log(data.toString()))
        if (this.verbose) cmd.stderr.on('data', data => this.log(data.toString(), colors.red))
      }
    });
  }

  private blankProjectExist(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.existsAsync(`./${this.blankProjectName}`)
        .then(exist => resolve(exist))
        .catch(err => reject(err));
    });
  }

  private angularJsonExist(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.existsAsync(`${Config.projectFolder}/angular.json`)
        .then(exist => resolve(exist))
        .catch(err => reject(err));
    });
  }

  private removeAngularJson(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.removeAsync(`${Config.projectFolder}/angular.json`)
        .then(_ => resolve())
        .catch(err => reject(err))
    });
  }

  /**
   * Remove Angular blank project
   * 
   * @private
   * @returns {Promise<any>} Resolve when folder is removed
   * @memberof AngularCliMigrator
   */
  private removeAngularBlankProject(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.verbose) this.log('Removing blank Angular project');
      fs.removeAsync(`./${this.blankProjectName}`)
        .then(() => {
          if (this.verbose) this.log('Blank Angular project removed');
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Create and moves migration files
   * 
   * @private
   * @returns 
   * @memberof AngularCliMigrator
   */
  private async createFiles() {
    const foldersToCreate = [
      `${Config.srcFolder}/environments`
    ]

    const filesToMoveToProject = [
      `angular.json`,
      `tsconfig.json`,
      `tslint.json`
    ]

    const filesToMoveToSrc = [
      `polyfills.ts`,
      `tsconfig.app.json`,
      `tsconfig.spec.json`,
      `environments/environment.ts`,
      `environments/environment.prod.ts`,
      `test.ts`,
      `tslint.json`
    ]

    for (const folder of foldersToCreate) {
      let exist = fs.existsSync(folder);
      if (!exist) {
        fs.mkdirsSync(folder);
        if (this.verbose) this.log(`${folder} created`, colors.green);
      }
    }

    const list = this.explanationGenerator.create('unordered-list', 'Generate files', 2)!;
    this.doneExplanations.insert(list);

    for (const file of filesToMoveToProject) {
      try {
        fs.renameSync(`./${this.blankProjectName}/${file}`, `${Config.projectFolder}/${file}`)
        list.insert(
          this.explanationGenerator.create('line', `${Config.projectFolder}/${file} created`)!
        )
      } catch (e) {

      }
      if (this.verbose) this.log(`${Config.projectFolder}/${file} created`, colors.green);
    }

    for (const file of filesToMoveToSrc) {
      try {
        fs.renameSync(`./${this.blankProjectName}/src/${file}`, `${Config.srcFolder}/${file}`);
        list.insert(
          this.explanationGenerator.create('line', `${Config.srcFolder}/${file} created`)!
        )
      } catch (e) {
        throw e;
      }
      if (this.verbose) this.log(`${Config.srcFolder}/${file} created`, colors.green);
    }

    fs.writeFile(`${Config.srcFolder}/main.ts`, '', err => {
      if (err) {
        throw err;
      } else {
        if (this.verbose) this.log(`${Config.srcFolder}/main.ts created`, colors.green);
        list.insert(
          this.explanationGenerator.create('line', `${Config.srcFolder}/main.ts created`)!
        )
      }
    })

  }

  /**
   * Update angular.json data
   * 
   * @private
   * @memberof AngularCliMigrator
   */
  private updateCLIConfig() {
    return new Promise(async (resolve, reject) => {
      const filePath = `${Config.projectFolder}/angular.json`;
      let config: any = fs.readFileSync(filePath, 'utf-8').toString();
      config = JSON.parse(config);

      this.updateSourceRoot(config);
      this.addTestConfig(config);

      try {
        await this.addAssets(config);
        await this.addStyles(config);
        await this.addScripts(config);
      } catch (error) {
        reject(error);
      }

      config = JSON.stringify(config, null, 2);
      await fs.writeFile(filePath, config);
      if (this.verbose) this.log('Config updated', colors.blue);
      resolve();
    });
  }

  /**
   * Add test file path to config
   * 
   * @private
   * @param {*} config angular.json config
   * @memberof AngularCliMigrator
   */
  private addTestConfig(config: any) {
    if (this.verbose) this.log('Update test config')
    config
      .projects[this.blankProjectName]
      .architect
      .test
      .options
      .karmaConfig = Config.karmaConfig;

    this.doneExplanations.insert(
      this.explanationGenerator.create('line', `Set config.projects.${this.blankProjectName}.architect.test.options.karmaConfig to ${Config.karmaConfig} in angular.json`)!
    )
  }

  /**
   * Add assets to config
   * 
   * @private
   * @param {*} config angular.json config
   * @memberof AngularCliMigrator
   */
  private addAssets(config: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const assets = this.updateGlobPathsForCLI(Config.projectAssets)
        .then(paths => {
          if (this.verbose) this.log('Update assets config');
          config
            .projects[this.blankProjectName]
            .architect
            .build
            .options
            .assets = paths;

          config
            .projects[this.blankProjectName]
            .architect
            .test
            .options
            .assets = paths;

          this.doneExplanations.insert(
            this.explanationGenerator.create('line', `Set config.projects.${this.blankProjectName}.architect.build.options.assets in angular.json to assets in config file`)!
          )

          this.doneExplanations.insert(
            this.explanationGenerator.create('line', `Set config.projects.${this.blankProjectName}.architect.test.options.assets in angular.json to assets in config file`)!
          )

          resolve();
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Extract styles form index.html and add them to config
   * 
   * @private
   * @param {*} config .angular-cli config
   * @returns 
   * @memberof AngularCliMigrator
   */
  private async addStyles(config: any) {
    const extractor = new DataExtractor();
    const remover = new DataRemover();

    return new Promise((resolve, reject) => {
      fs.readFile(`${Config.srcFolder}/index.html`, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          let html = data.toString();
          // Get all styles tag from index.html
          let matches = extractor.extractTagWithAttribute(html, 'link', 'rel', 'stylesheet', false);
          let styles = this.updatePathsForCLI(extractor.extractHTMLAttribute(matches.toString(), 'link', 'href', false));

          const list = this.explanationGenerator.create('ordered-list', `Add styles to angular.json`, 2)!

          list.insert(
            this.explanationGenerator.create('line', `Find in index.html all \`<link rel="stylesheet">\` and extract 'href' attribute`)!
          )
          list.insert(
            this.explanationGenerator.create('line', `Add src folder to 'href' start`)!
          )

          config
            .projects[this.blankProjectName]
            .architect
            .build
            .options
            .styles = styles;

          list.insert(
            this.explanationGenerator.create('line', `Add extracted styles to config.projects.${this.blankProjectName}.architect.build.options.styles in angular.json`)!
          )

          config
            .projects[this.blankProjectName]
            .architect
            .test
            .options
            .styles = styles;

          list.insert(
            this.explanationGenerator.create('line', `Add extracted styles to config.projects.${this.blankProjectName}.architect.test.options.styles in angular.json`)!
          )

          html = remover.removeHTMLTagWithAttributeData(html, 'link', 'rel', 'stylesheet', false);
          html = remover.removeAloneHTMLComments(html);

          list.insert(
            this.explanationGenerator.create('line', `Remove all \`<link rel="stylesheet">\` from index.html`)!
          )

          fs.writeFileSync(`${Config.srcFolder}/index.html`, html);

          this.doneExplanations.insert(list)

          if (this.verbose) this.log('Update styles config');
          resolve(config);
        }
      })
    });
  }

  /**
   * Extract scripts from index.html and add them to config
   * 
   * @private
   * @param {*} config .angular-cli config
   * @returns 
   * @memberof AngularCliMigrator
   */
  private async addScripts(config: any) {
    const extractor = new DataExtractor();
    const remover = new DataRemover();

    return new Promise((resolve, reject) => {
      fs.readFile(`${Config.srcFolder}/index.html`, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          let html = data.toString();
          // Get all scripts from index.html
          let scripts = this.updatePathsForCLI(extractor.extractHTMLAttribute(html, 'script', 'src'));

          const list = this.explanationGenerator.create('ordered-list', `Add scripts to angular.json`, 2)!;

          list.insert(
            this.explanationGenerator.create('line', `Find in index.html all \`<script>\` and extract 'src' attribute`)!
          )
          list.insert(
            this.explanationGenerator.create('line', `Add src folder to 'src' start`)!
          )

          config
            .projects[this.blankProjectName]
            .architect
            .build
            .options
            .scripts = scripts;

          list.insert(
            this.explanationGenerator.create('line', `Add extracted scripts to config.projects.${this.blankProjectName}.architect.build.options.scripts in angular.json`)!
          )

          config
            .projects[this.blankProjectName]
            .architect
            .test
            .options
            .scripts = scripts;

          list.insert(
            this.explanationGenerator.create('line', `Add extracted scripts to config.projects.${this.blankProjectName}.architect.test.options.scripts in angular.json`)!
          )

          html = remover.removeHTMLTag(html, 'script');
          html = remover.removeAloneHTMLComments(html);

          list.insert(
            this.explanationGenerator.create('line', `Remove all \`<script>\` from index.html`)!
          )

          fs.writeFileSync(`${Config.srcFolder}/index.html`, html);

          this.doneExplanations.insert(list)

          if (this.verbose) this.log('Update scripts config');
          resolve(config);
        }
      })
    });
  }

  /**
   * Update regex in test.ts file
   * 
   * @private
   * @memberof AngularCliMigrator
   */
  private async updateTestFile() {
    const filePath = `${Config.srcFolder}/test.ts`;
    return new Promise((resolve, reject) => {
      fs.readFileAsync(filePath)
        .then(data => {
          let file = data.toString();
          file = file.replace(/spec\\.ts/, 'spec..?s');
          if (this.verbose) this.log('Test file updated', colors.blue);

          this.doneExplanations.insert(
            this.explanationGenerator.create('line', `Replace 'spec.ts' by 'spec..?s' in test.ts to load both .ts and .js specs files`)!
          )

          fs.writeFileAsync(filePath, file)
            .then(() => resolve())
            .catch(err => reject(err));
        })
        .catch(err => reject(err));
    });
  }

  private updateSourceRoot(config: any) {
    const sourceRoot = Config.srcFolder.split(/(\\|\/)/).pop();
    config
      .projects[this.blankProjectName]
      .sourceRoot = sourceRoot;

    this.doneExplanations.insert(
      this.explanationGenerator.create('line', `Set config.projects.${this.blankProjectName}.sourceRoot to ${sourceRoot} in angular.json`)!
    )
  }

  private updatePathsForCLI(paths: string[]): string[] {
    const sourceRoot = Config.srcFolder.split(/(\\|\/)/).pop();
    return paths.map(path => `${sourceRoot}/${path}`);
  }

  private updateGlobPathsForCLI(paths: string[]): Promise<string[]> {
    const sourceRoot = Config.srcFolder.split(/(\\|\/)/).pop();
    return new Promise((resolve, reject) => {
      let newPaths: string[] = [];
      let count = paths.length;
      if (!paths.length) {
        resolve([]);
      } else {
        paths.forEach((path, index) => {
          glob(`${Config.srcFolder}/${path}`, (err, files) => {
            if (err) {
              reject(err);
            } else {
              newPaths = newPaths.concat(files);
              count--;
              if (count === 0) {
                const srcFolder = Config.srcFolder.replace(/\\/g, '\/');
                newPaths = newPaths.map(path => `${sourceRoot}${path.replace(srcFolder, '')}`)
                resolve(newPaths);
              }
            }
          })
        })
      }
    });
  }

  /**
   * Launch Angular CLI migration
   * 
   * @memberof AngularCliMigrator
   */
  async launch() {
    try {
      await this.createAngularBlankProject();
    } catch (e) {
      return e;
    }
    await this.createFiles();
    await this.updateCLIConfig();
    await this.updateTestFile();
    await this.installDependencies();

    // Remove blank project
    try {
      await this.removeAngularBlankProject();
    } catch (e) {
      throw e;
    }
  }
}
