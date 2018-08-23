import colors from 'colors';
import fs from 'fs';
import path from 'path';
import { Config } from '../../config/config';
import { NpmInstallator } from '../utils/npm-installator';
import { ExplanationGenerator } from './../explainer/explanation-generator';
import { RootPath } from './../utils/root-path';
import { Migrator } from './migrator';


export class TypescriptMigrator extends Migrator {

  private readonly dependencies = [
    'typescript', '@types/jasmine', '@types/angular', '@types/angular-animate', '@types/angular-cookies', '@types/angular-mocks', '@types/angular-resource', '@types/angular-route', '@types/angular-sanitize'
  ]

  constructor(verbose = true) {
    super(verbose, '[TYPESCRIPT MIGRATOR]', colors.yellow);
  }

  /**
   * Generate tsconfig file in src folder
   * 
   * @private
   * @returns {Promise<any>} Resolve when file is generated
   * @memberof TypescriptMigrator
   */
  private generateTypescriptConfig(): Promise<any> {
    const samplePath = path.join(RootPath.path, './samples/tsconfig.sample.json');

    return new Promise((resolve: any, reject: any) => {
      fs.copyFile(samplePath, `${Config.srcFolder}/tsconfig.json`, err => {
        if (err) {
          reject(err);
        } else {
          if (this.verbose) this.log(`${Config.srcFolder}/tsconfig.json generated`);
          ExplanationGenerator.instance.insertIn(this.doneExplanations,
            this.explanationGenerator.create('checked-checkbox', 'Generate tsconfig.json')!)
          resolve();
        }
      });
    });
  }

  /**
   * Install TS dependencies (types and typescript) and save them to devDeps in project folder
   * 
   * @private
   * @returns {Promise<any>} Resolve when dependencies are installed
   * @memberof TypescriptMigrator
   */
  private installDependencies(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.verbose) this.log('Installing TypeScript dependencies');

      const installator = new NpmInstallator();

      if (!Config.noInstall) {
        installator.installOneByOne(this.dependencies, {
          cwd: Config.projectFolder,
          saveDev: true,
          verbose: Config.npmVerbose
        })
          .then(_ => {
            if (this.verbose) this.log('TypeScript dependencies installed');

            this.doneExplanations.insert(
              this.explanationGenerator.create('checked-checkbox', 'Install TypeScript dependencies')!
            )

            resolve();
          })
          .catch(err => reject(err));
      } else {
        installator.writeToPackageJson(`${Config.projectFolder}/package.json`, this.dependencies, { saveDev: true, verbose: Config.npmVerbose })
          .then(() => {
            if (this.verbose) this.log('TypeScript dependencies saved to package.json');

            this.doneExplanations.insert(
              this.explanationGenerator.create('checked-checkbox', 'TypeScript dependencies saved to package.json')!
            )
            this.todoExplanations.insert(
              this.explanationGenerator.create('unchecked-checkbox', 'Install dependencies')!
            )

            resolve();
          })
          .catch(err => reject(err));
      }
    });
  }

  /**
   * Launch TS Migration
   * 
   * @memberof TypescriptMigrator
   */
  async launch() {
    this.generateTypescriptConfig()
      .catch(err => this.log(err, colors.red));

    await this.installDependencies()
      .catch(err => this.log(err, colors.red));
  }
}
