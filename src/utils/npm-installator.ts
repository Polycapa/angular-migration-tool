import { ChildProcess, spawn } from 'child_process';
import fs from 'fs-extra-promise';
import os from 'os';
import { Logger } from './logger';

interface NPMInstallatorOptions {
  cwd?: string;
  save?: boolean;
  saveDev?: boolean;
  verbose?: boolean;
};


export class NpmInstallator extends Logger {
  private command: string;

  constructor() {
    super('[NPM]');
    this.command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  }

  /**
   * Install NPM dependencies
   * 
   * @param {string[]} dependencies Array of dependencies to install
   * @param {NPMInstallatorOptions} { cwd = process.cwd(), save = false, saveDev = false, verbose = false } Options for the installator 
   * @returns {ChildProcess} Return ChildProcess executing the installation
   * @memberof NpmInstallator
   */
  install(dependencies: string[], { cwd = process.cwd(), save = false, saveDev = false, verbose = false }: NPMInstallatorOptions): ChildProcess {
    let args = ['install'];
    if (save) {
      args.push('--save');
    }

    if (saveDev) {
      args.push('--save-dev');
    }

    args = args.concat(dependencies);

    const install = spawn(this.command, args.concat(dependencies), {
      cwd: cwd
    });

    return install;
  }

  /**
   * Install NPM dependencies
   * 
   * @param {string[]} dependencies Array of dependencies to install
   * @param {NPMInstallatorOptions} { cwd = process.cwd(), save = false, saveDev = false, verbose = false } Options for the installator
   * @returns {Promise<any>} Resolve when dependencies are installed
   * @memberof NpmInstallator
   */
  installPromise(dependencies: string[], { cwd = process.cwd(), save = false, saveDev = false, verbose = false }: NPMInstallatorOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      let args = ['install'];
      if (save) {
        args.push('--save');
      }

      if (saveDev) {
        args.push('--save-dev');
      }

      args = args.concat(dependencies);

      this.log(`Executing ${this.command} ${args.join(' ')}`);
      const install = spawn(this.command, args, {
        cwd: cwd
      });

      if (verbose) install.stdout.on('data', data => this.log(data.toString()));
      if (verbose) install.stderr.on('data', data => this.log(data.toString()));
      install.on('error', err => reject(err));
      install.on('close', code => resolve());
      install.on('exit', code => resolve());
    });
  }

  /**
   * Install NPM dependencies (one by one)
   * 
   * @param {string[]} dependencies Array of dependencies to install
   * @param {NPMInstallatorOptions} { cwd = process.cwd(), save = false, saveDev = false, verbose = false } Options for the installator
   * @returns {Promise<any>} Resolve when all dependencies are installed
   * @memberof NpmInstallator
   */
  installOneByOne(dependencies: string[], { cwd = process.cwd(), save = false, saveDev = false, verbose = false }: NPMInstallatorOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      let dependency = dependencies.shift();
      if (dependency) {
        this.installPromise([dependency], { cwd: cwd, save: save, saveDev: saveDev, verbose: verbose })
          .then(_ => {
            this.installOneByOne(dependencies, { cwd: cwd, save: save, saveDev: saveDev, verbose: verbose })
              .then(_ => resolve())
              .catch(err => reject(err))
          })
      } else {
        resolve();
      }
    });
  }

  /**
   * Generate NPM command
   * 
   * @param {string[]} dependencies Array of dependencies to install
   * @param {NPMInstallatorOptions} { cwd = process.cwd(), save = false, saveDev = false, verbose = false } Options for the installator
   * @returns {string} Return NPM command
   * @memberof NpmInstallator
   */
  outputCommand(dependencies: string[], { cwd = process.cwd(), save = false, saveDev = false, verbose = false }: NPMInstallatorOptions): string {
    let args = ['install'];
    if (save) {
      args.push('--save');
    }

    if (saveDev) {
      args.push('--save-dev');
    }

    args = args.concat(dependencies);

    return `${this.command} ${args.join(' ')}`;
  }

  writeToPackageJson(path: string, dependencies: string[], { cwd = process.cwd(), save = false, saveDev = false, verbose = false }: NPMInstallatorOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFileAsync(path)
        .then(data => {
          let packageContent = JSON.parse(data.toString());
          for (const dependency of dependencies) {
            const atIndex = dependency.lastIndexOf('@');
            // Test if an @ exist and is not the first char
            const test = atIndex !== -1 && atIndex !== 0;
            const dependencyName = test ? dependency.substring(0, atIndex) : dependency;
            const dependencyVersion = test ? dependency.substring(atIndex + 1) : 'latest';

            if (save) {
              packageContent.dependencies[dependencyName] = dependencyVersion;
              if (verbose) this.log(`Saved ${dependencyName}@${dependencyVersion} in dependencies of ${path}`);
            } else if (saveDev) {
              packageContent.devDependencies[dependencyName] = dependencyVersion;
              if (verbose) this.log(`Saved ${dependencyName}@${dependencyVersion} in devDependencies of ${path}`);
            }
          }

          const packageJSON = JSON.stringify(packageContent, null, 2);
          fs.writeFileAsync(path, packageJSON)
            .then(() => resolve())
            .catch(err => reject(err));
        })
        .catch(err => console.log(err));
    });
  }
}
