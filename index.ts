import program from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { Config } from './config/config';
import { ConfigFile } from './config/config-file';
import { ExplanationGenerator } from './src/explainer/explanation-generator';
import { AngularCliMigrator } from './src/migrators/angularcli-migrator';
import { AttributeDirectiveMigrator } from './src/migrators/attribute-directive-migrator';
import { ComponentMigrator } from './src/migrators/component-migrator';
import { ConstantMigrator } from './src/migrators/constant-migrator';
import { ControllerMigrator } from './src/migrators/controller-migrator';
import { DirectiveMigrator } from './src/migrators/directive-migrator';
import { FilterMigrator } from './src/migrators/filter-migrator';
import { LintMigrator } from './src/migrators/lint-migrator';
import { NoAngularJSMigrator } from './src/migrators/noangularjs-migrator';
import { ServiceMigrator } from './src/migrators/service-migrator';
import { TestsMigrator } from './src/migrators/tests-migrator';
import { TypescriptMigrator } from "./src/migrators/typescript-migrator";
import { UpgradeModuleMigrator } from "./src/migrators/upgrademodule-migrator";


program
  .version('1.10.0')
  .usage('<options>')
  .option('-t, --ts', 'Launch TypeScript migration')
  .option('-C, --cli', 'Launch Angular CLI migration')
  .option('-u, --upgrade', 'Launch UpgradeModule migration')
  .option('-d, --directives', 'Launch AngularJS directives to AngularJS components migration')
  .option('-a, --attributes', 'Launch AngularJS attribute directives to Angular directive migration')
  .option('-c, --components', 'Launch AngularJS components to Angular component migration')
  .option('-s, --services', 'Launch AngularJS services to Angular injectable migration')
  .option('-f, --filters', 'Launch AngularJS filters to Angular pipe migration')
  .option('-o, --controller', 'Launch AngularJS controller to Angular component migration')
  .option('--constants', 'Launch AngularJS constants to TS constants migration')
  .option('-T, --tests', 'Launch tests migration')
  .option('-n, --angular', 'Remove AngularJS')
  .option('-l, --lint', 'Lint and fix components')
  .option('-A, --all', 'Launch all migrations (except --angular and --lint)')
  .option('-p, --project [path]', 'Path to config file')
  .option('-I, --init', 'Init config file (ignore other args)')
  .option('--no-verbose', 'Remove logs')
  .option('--no-install', 'Doesn\'t run NPM commands')
  .parse(process.argv);

if (process.argv.length <= 2) {
  program.outputHelp();
  process.exit(0);
}


let tsMigrator: TypescriptMigrator,
  cliMigrator: AngularCliMigrator,
  upgradeModuleMigrator: UpgradeModuleMigrator,
  directiveMigrator: DirectiveMigrator,
  attributeDirectiveMigrator: AttributeDirectiveMigrator,
  componentMigrator: ComponentMigrator,
  serviceMigrator: ServiceMigrator,
  noAngularJSMigrator: NoAngularJSMigrator,
  lintMigrator: LintMigrator,
  testsMigrator: TestsMigrator,
  filterMigrator: FilterMigrator,
  constantsMigrator: ConstantMigrator,
  controllerMigrator: ControllerMigrator;



async function launchMigrations() {
  try {
    if (program.ts || program.all) await tsMigrator.launch();
    if (program.cli || program.all) await cliMigrator.launch();
    if (program.upgrade || program.all) await upgradeModuleMigrator.launch();
    if (program.directives || program.all) await directiveMigrator.launch();
    if (program.attributes || program.all) await attributeDirectiveMigrator.launch();
    if (program.components || program.all) await componentMigrator.launch();
    if (program.services || program.all) await serviceMigrator.launch();
    if (program.filters || program.all) await filterMigrator.launch();
    if (program.angular) await noAngularJSMigrator.launch();
    if (program.lint) await lintMigrator.launch();
    if (program.tests || program.all) await testsMigrator.launch();
    if (program.constants || program.all) await constantsMigrator.launch();
    if (program.controller || program.all) await controllerMigrator.launch();
  } catch (e) {
    console.log(e.toString());
    process.exit(1);
  }
  outputExplanations();
}

function readFile(path: string): string {
  try {
    return fs.readFileSync(path).toString();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  return '';
}

function initConfig() {
  Config.init()
    .then(config => {
      fs.writeFile(path.resolve(process.cwd(), './config.json'), JSON.stringify(config, null, 2), err => {
        if (err) {
          throw err;
        }
      });
    })
}

function setConfig() {
  let configContent: string;
  if (program.project) {
    configContent = readFile(program.project);
  } else {
    let exist = fs.existsSync(`${process.cwd()}/config.json`)
    if (exist) {
      configContent = readFile(`${process.cwd()}/config.json`);
    } else {
      configContent = readFile(`${process.cwd()}/config/config.json`);
    }
  }

  const config: ConfigFile = JSON.parse(configContent);
  if (!program.install) config.noInstall = true;
  Config.set(config);
}

function initMigrators() {
  tsMigrator = new TypescriptMigrator(program.verbose);
  cliMigrator = new AngularCliMigrator(program.verbose);
  upgradeModuleMigrator = new UpgradeModuleMigrator(program.verbose);
  directiveMigrator = new DirectiveMigrator(program.verbose);
  attributeDirectiveMigrator = new AttributeDirectiveMigrator(program.verbose);
  componentMigrator = new ComponentMigrator(program.verbose);
  serviceMigrator = new ServiceMigrator(program.verbose);
  noAngularJSMigrator = new NoAngularJSMigrator(program.verbose);
  lintMigrator = new LintMigrator(program.verbose);
  testsMigrator = new TestsMigrator(program.verbose);
  filterMigrator = new FilterMigrator(program.verbose);
  constantsMigrator = new ConstantMigrator(program.verbose);
  controllerMigrator = new ControllerMigrator(program.verbose);
}

function outputExplanations() {
  const data = ExplanationGenerator.instance.generateMarkdown();
  let path = Config.migrationReadme;
  let fileName = path.substring(path.lastIndexOf('/') + 1);
  if (!fileName) {
    path += 'MIGRATION.md'
  } else {
    const ext = fileName.substring(fileName.lastIndexOf('.') + 1);
    if (ext !== 'md') {
      path += '.md';
    }
  }

  fs.writeFileSync(path, data);
}

if (program.init) {
  initConfig();
} else {
  setConfig();
  initMigrators();
  launchMigrations();
}
