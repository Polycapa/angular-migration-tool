import colors from 'colors';
import fs from 'fs-extra-promise';
import path from 'path';
import { ServiceAnalyser } from '../analysers/service-analyser';
import { Config } from './../../config/config';
import { Service } from './../analysers/models/service';
import { UnitTestAnalyser } from './../analysers/unit-test-analyser';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { Path } from './../files/models/path';
import { ServiceSpecGenerator } from './../generators/service-spec-generator';
import { RootPath } from './../utils/root-path';
import { Migrator } from './migrator';
import { ServiceToInjectable } from './service-to-injectable';

export class ServiceMigrator extends Migrator {

  constructor(verbose = true) {
    super(verbose, '[SERVICE TO INJECTABLE]');
  }

  private async getInjectableCode(file: File) {
    const analyser = new ServiceAnalyser();
    const mover = new ServiceToInjectable();
    const finder = new FilesFinder();

    let key = file.path.key;

    let serviceContent = file.content;

    const service = analyser.analyse(serviceContent);

    const list = this.explanationGenerator.create('unordered-list', `Migrate ${service.name}`, 2);

    this.doneExplanations.insert(list)

    const serviceList = this.explanationGenerator.create('unordered-list', `Extract service`, 4);

    list.insert(serviceList);

    serviceList.insert(
      this.explanationGenerator.create('chip', `Extract service name : ${service.name}`),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          `Extract service body : `,
          { type: 'code', content: service.body }
        )
      ),
      this.explanationGenerator.create('chip',
        this.explanationGenerator.buildMarkdown(
          'Extract controller name :',
          { type: 'inline-code', content: JSON.stringify(service.inject) }
        )
      )
    )

    const code = await mover.move(key, service);

    const serviceCodeList = this.explanationGenerator.create('unordered-list', `Generate service code`, 4);

    list.insert(serviceCodeList);

    serviceCodeList.insert(
      this.explanationGenerator.create('chip', `Insert name`),
      this.explanationGenerator.create('chip', `Insert properties (private)`),
      this.explanationGenerator.create('chip', `Insert injections as constructor parameters (private)`),
      this.explanationGenerator.create('chip', `Insert functions (public), convert all functions in their body to arrow functions and insert function comments`),
      this.explanationGenerator.create('chip', `Set all functions parameters type to any`),
      this.explanationGenerator.create('chip', `Add this reference to inputs, properties and injections calls`)
    )

    let log = `
${`***** ${key.toUpperCase()} ANGULAR SERVICE *****`.green}
${code}`;

    if (Config.services.generatedFilesFolder) {
      const exist = fs.existsSync(Config.services.generatedFilesFolder);

      if (!exist) {
        fs.mkdirsSync(Config.services.generatedFilesFolder);
      }

      try {
        fs.mkdirsSync(`${Config.services.generatedFilesFolder}/${key}`)
      } catch (err) {

      }

      fs.writeFile(`${Config.services.generatedFilesFolder}/${key}/${key}${Config.services.generatedPrefix}.service.ts`, code, err => {
        if (err) {
          throw err;
        } else {
          if (this.verbose) this.log(`${Config.services.generatedFilesFolder}/${key}/${key}${Config.services.generatedPrefix}.service.ts created`, colors.green)
        }
      });

      const moduleCode = await this.generateModuleCode(key, service);

      this.createFile(`${Config.services.generatedFilesFolder}/${key}/${key}${Config.services.generatedPrefix}.module.ts`, moduleCode)


      const { spec: specFile } = await finder.findAngularJSServiceRelatedFiles(file);

      // Generate spec file
      if (specFile) {
        const unitTest = await this.generateSpecCode(service.name, specFile);
        log += this.createLog(`${key.toUpperCase()} ANGULAR SERVICE SPEC`, unitTest);
        this.createFile(`${Config.services.generatedFilesFolder}/${key}/${key}${Config.services.generatedPrefix}.service.spec.ts`, unitTest);

        list.insert(
          this.explanationGenerator.create('unchecked-checkbox',
            this.explanationGenerator.buildMarkdown(
              'Move ',
              { type: 'bold', content: `${Config.services.generatedFilesFolder}/${key}/${key}${Config.services.generatedPrefix}.service.spec.ts` },
              ' to ',
              { type: 'bold', content: `${file.path.withoutFilename()}/${key}.service.spec.ts` }
            )
          )
        )
      }
    }

    if (Config.services.output) {
      this.log(log);
    }
  }

  private async generateModuleCode(key: string, service: Service): Promise<string> {
    const samplePath = new Path(path.join(RootPath.path, './samples/feature.module.sample.ts'));

    const sample = new File(samplePath);

    const moduleName = `${service.name}Module`;

    let code = sample.content
      .replace('$moduleName', moduleName)
      .replace('$declarations', '')
      .replace('$exports', '')
      .replace('$import', '')

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
      this.explanationGenerator.create('line', `Insert TranslateModule code in service module`)!,
      this.explanationGenerator.create('line', `Insert HttpLoaderFactory code in service module`)!
    );

    this.doneExplanations.insert(list);

    return appModuleCode;
  }

  private async generateSpecCode(serviceName: string, serviceSpecFile: File): Promise<string> {
    const specAnalyser = new UnitTestAnalyser();
    const generator = new ServiceSpecGenerator();
    const key = serviceSpecFile.path.key;

    const content = serviceSpecFile.content;
    const test = specAnalyser.analyse(content);

    if (!test) return '';

    const code = await generator.generate(serviceName, test);

    return code;
  }

  async launch() {
    const finder = new FilesFinder();
    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Look for external libraries (like lodash) uses'),
      this.explanationGenerator.create('unchecked-checkbox', 'Migrate $ injections in constructor to Angular injections'),
      this.explanationGenerator.create('unchecked-checkbox', 'Inject services as constructor parameters in components and directives where they are used'),
    )

    let files: File[] = [];
    for (const path of Config.services.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSServices(path)
        ]
      }
    }

    for (const file of files) {
      await this.getInjectableCode(file);
    }
  }
}
