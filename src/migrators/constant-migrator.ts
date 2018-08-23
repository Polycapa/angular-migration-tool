import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import { Config } from './../../config/config';
import { ConstantAnalyser } from './../analysers/constant-analyser';
import { Constant } from './../analysers/models/constant';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { Path } from './../files/models/path';
import { Migrator } from "./migrator";

export class ConstantMigrator extends Migrator {

  constructor(verbose = true) {
    super(verbose, '[CONSTANTS MIGRATOR]');
  }

  private async getConstantCode(files: File[]) {
    const analyser = new ConstantAnalyser();
    let constants: Constant[] = [];

    for (const file of files) {
      constants = [
        ...constants,
        ...analyser.analyse(file.content)
      ]
    }

    const code = this.generateCode(constants);

    if (Config.constants.generatedFile) {
      const path = new Path(Config.constants.generatedFile);
      fs.mkdirsSync(path.withoutFilename());
      await this.createFile(path.value, code);
    }

    if (Config.constants.output) {
      const log = this.createLog('PROJECT CONSTANTS', code);
      this.log(log);
    }
  }

  private generateCode(constants: Constant[]): string {
    let code = '';

    for (const constant of constants) {
      code += `
      export const ${constant.name} = ${constant.value};
      `;
    }

    return beautify(code);
  }

  async launch(): Promise<any> {
    const finder = new FilesFinder();

    let files: File[] = [];
    for (const path of Config.constants.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSConstants(path)
        ]
      }
    }

    await this.getConstantCode(files);
  }

}
