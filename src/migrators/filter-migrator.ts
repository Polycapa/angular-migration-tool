import colors from 'colors';
import fs from 'fs-extra-promise';
import { GeneratedContent } from '../explainer/models/generated-content';
import { Path } from '../files/models/path';
import { Config } from './../../config/config';
import { FilterAnalyser } from './../analysers/filter-analyser';
import { UnitTestAnalyser } from './../analysers/unit-test-analyser';
import { FilesFinder } from './../files/files-finder';
import { File } from './../files/models/file';
import { PipeGenerator } from './../generators/pipe-generator';
import { PipeSpecGenerator } from './../generators/pipe-spec-generator';
import { Migrator } from "./migrator";

export class FilterMigrator extends Migrator {
  private currentExplanation: GeneratedContent | undefined;
  private todoCurrentExplanation: GeneratedContent | undefined;

  constructor(verbose = true) {
    super(verbose, '[FILTERS MIGRATOR]', colors.gray);
  }

  async getPipeCode(file: File) {
    const finder = new FilesFinder();
    const analyser = new FilterAnalyser();
    const generator = new PipeGenerator();

    let filtersContent = '';
    try {
      filtersContent = file.content;
    } catch (e) {
      this.log(e, colors.red);
      return;
    }

    this.currentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${file.toString()}`, 2)

    this.todoCurrentExplanation = this.explanationGenerator.create('unordered-list', `Migrate ${file.toString()}`, 2);

    this.doneExplanations.insert(this.currentExplanation);
    this.todoExplanations.insert(this.todoCurrentExplanation);

    const { spec: specFile } = await finder.findAngularJSFilterRelatedFiles(file);

    const filters = analyser.analyse(filtersContent);

    try {
      fs.mkdirsSync(Config.filters.generatedFilesFolder);
    } catch (e) {
      this.log(e, colors.red);
      return;
    }

    let log = '';

    for (const filter of filters) {
      const key = filter.name
        .replace(/^[A-Z]/, letter => letter.toLowerCase())
        .replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());

      const generatedFilePath = `${Config.filters.generatedFilesFolder}/${key}${Config.filters.generatedPrefix}.pipe.ts`;

      const filterName = filter.name.charAt(0).toUpperCase() + filter.name.substring(1) + 'Pipe';

      const pipe = await generator.generate(filter);

      await this.createFile(generatedFilePath, pipe);

      log += this.createLog(`${filter.name.toUpperCase()} ANGULAR PIPE`, pipe);

      const doneList = this.explanationGenerator.create('unordered-list', `Extract ${filter.name} filter`, 4);

      this.currentExplanation.insert(doneList);

      doneList.insert(
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract filter name : ',
            { type: 'inline-code', content: filter.name }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract filter injections : ',
            { type: 'inline-code', content: filter.injections.map(el => el.name).join(',') }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract filter parameters : ',
            { type: 'inline-code', content: filter.params.map(el => el.name).join(',') }
          )
        ),
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Extract filter body : ',
            { type: 'code', content: filter.body }
          )
        )
      )

      const pipeCodeList = this.explanationGenerator.create('unordered-list', `Create ${filter.name} filter`, 4);

      this.currentExplanation.insert(pipeCodeList);

      pipeCodeList.insert(
        this.explanationGenerator.create('chip', `Insert selector`),
        this.explanationGenerator.create('chip', `Insert class name`),
        this.explanationGenerator.create('chip', `Insert injections as constructor parameters (private)`),
        this.explanationGenerator.create('chip', `Insert filter code in transform function`),
        this.explanationGenerator.create('chip', `Set all transform parameters type to any`)
      )

      const todoList = this.explanationGenerator.create('unordered-list', `Migrate ${filter.name} filter`, 4);

      this.todoCurrentExplanation.insert(todoList);

      todoList.insert(
        this.explanationGenerator.create('chip',
          this.explanationGenerator.buildMarkdown(
            'Add ',
            { type: 'inline-code', content: filterName },
            ' to app.module.ts providers'
          )
        )
      )
    }

    if (specFile) {
      const unitTest = await this.generateSpecCode(specFile);
      log += this.createLog(`${file.toString()} SPEC`, unitTest);

      const generatedSpecPath = `${Config.filters.generatedFilesFolder}/${file.path.key}${Config.filters.generatedPrefix}.spec.ts`;

      this.createFile(generatedSpecPath, unitTest);

      this.todoCurrentExplanation.insert(
        this.explanationGenerator.create('unchecked-checkbox',
          this.explanationGenerator.buildMarkdown(
            'Move ',
            { type: 'bold', content: generatedSpecPath },
            ' to ',
            { type: 'bold', content: `${file.path.withoutFilename()}/${file.path.key}${Config.filters.generatedPrefix}.spec.ts` }
          )
        )
      )
    }

    if (Config.components.output) {
      this.log(log);
    }
  }

  private async generateSpecCode(filterSpecFile: File) {
    const specAnalyser = new UnitTestAnalyser();
    const generator = new PipeSpecGenerator();

    const content = filterSpecFile.content;
    const test = specAnalyser.analyse(content);

    if (!test) return '';

    const code = await generator.generate(test);

    const list = this.explanationGenerator.create('unordered-list', 'Generate spec', 4);

    this.currentExplanation!.insert(list);

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
      this.explanationGenerator.create('unchecked-checkbox', 'Check filters import'
      )
    )

    return code;

  }

  async launch() {
    const finder = new FilesFinder();

    this.todoExplanations.insert(
      this.explanationGenerator.create('unchecked-checkbox', 'Import new pipe in app.module.ts'),
      this.explanationGenerator.create('unchecked-checkbox',
        this.explanationGenerator.buildMarkdown(
          'Migrate $injections in constructor to Angular injections, otherwise it will cause an ',
          { type: 'inline-code', content: "Can't resolve all parameters for" },
          ' error'
        )
      ),
    )

    let files: File[] = [];
    for (const path of Config.filters.files) {
      let _path = new Path(path);
      if (_path.isFile()) {
        files.push(new File(_path))
      } else {
        files = [
          ...files,
          ...await finder.findAngularJSFilters(path)
        ]
      }
    }

    for (const file of files) {
      await this.getPipeCode(file);
    }
  }

}
