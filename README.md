**Current version** : `1.10.0`

# Requirements

-   Angular CLI : `npm i -g` `@angular/cli`    

# How to install

## Local

`npm i`

## Global

`npm i -g`

# How to use

## Local
  

`node index.js <options>`

## Global

`migration-tool <options>`

## First use

Use `{tool_command} -I` option to generate `config.json` file

# How to update tool

Go in tool folder and run `npm i -g` after pulling

# Configuration

## Configuration file

-   projectFolder (string) : Path to migrated project root folder
    
-   srcFolder (string) : Path to migrated project source folder
    
-   npmVerbose (boolean) : If true, display npm logs
    
-   noInstall (boolean) : If true, save dependencies to package.json. If false, execute npm install
    
-   project : All configurations related to the project to migrate
    
    -   name (string) : The name of the project
        
    -   assets (string\[\]) : Assets to insert in Angular CLI config (**support globs**)
        
    -   moduleName (string) : The name of the project module
        
    -   appComponentSelector (string) : The HTML selector (like my-selector) for the app main component in index.html
        
    -   karmaConfig (string) : Path to the karma.conf.js file
        
    -   migrationReadme (string) : Path to the file generated containing data about what the tool do and what devs need to do
        
    -   tagDirectives : Configurations related to tag directives
        
        -   generatedFilesFolder (string) : Path to the folder where files will be generated
            
        -   generateUndeclaredWarning (boolean) : If true, when bindings are removed from injections, add a WARNING comment where unusable code can exist
            
        -   updateRemovedInjectedBindings (boolean) : If true, when bindings are removed from injections, add *ctrl.* before each binding call
            
        -   output (boolean) : If true, output generated code to console
            
        -   files (string\[\]) : Files to migrate (**support folder and file name**)
            
        -   routerConfig (string) : Path to the router config file
            
        -   generatedPrefix (string) : A prefix to add to file type (.directive can become .generated.directive for example)
            
        -   upgrade (boolean) : If true, generate UpgradeModule code for AngularJS component
            
    -   attributeDirectives : Configurations related to attribute directives
        
        -   generatedFilesFolder (string) : Path to the folder where files will be generated
            
        -   generateUndeclaredWarning (boolean) : If true, when bindings are removed from injections, add a WARNING comment where unusable code can exist
            
        -   updateRemovedInjectedBindings (boolean) : If true, when bindings are removed from injections, add *ctrl.* before each binding call
            
        -   output (boolean) : If true, output generated code to console
            
        -   files (string\[\]) : Files to migrate. (**support folder and file name**)
            
        -   generatedPrefix (string) : A prefix to add to file type (.directive can become .generated.directive for example)
            
    -   components : Configurations related to AngularJS components
        
        -   generatedFilesFolder (string) : Path to the folder where files will be generated
            
        -   files (string\[\]) : Files to migrate. (**support folder and file name**)
            
        -   output (boolean) : If true, output generated code to console
            
        -   downgrade (boolean) : If true, generate UpgradeModule code for Angular component
            
        -   generatedPrefix (string) : A prefix to add to file type (.component can become .generated.component for example)
            
        -   insertInjections (boolean) : If true, AngularJS injections will be added as Angular component constructor parameters (way of Angular to do injections)
            
    -   services : Configurations related to AngularJS services
        
        -   generatedFilesFolder (string) : Path to the folder where files will be generated
            
        -   files (string\[\]) : Files to migrate. (**support folder and file name**)
            
        -   output (boolean) : If true, output generated code to console
            
        -   generatedPrefix (string) : A prefix to add to file type (.service can become .generated.service for example)
            
        -   insertInjections (boolean) : If true, AngularJS injections will be added as Angular component constructor parameters (way of Angular to do injections)
        -   
    -   filters : Configurations related to AngularJS filters
        
        -   generatedFilesFolder (string) : Path to the folder where files will be generated
            
        -   files (string\[\]) : Files to migrate. (**support folder and file name**)
            
        -   output (boolean) : If true, output generated code to console
            
        -   generatedPrefix (string) : A prefix to add to file type (.service can become .generated.service for example)
            
    -   routing : Configurations related to Angular routing
        
        -   generate (boolean) : If true, generate Angular router code
            
        -   routes ({path: string, component: component class name}\[\]) : Routes to insert in app module
            
    -   i18n : Configurations related to Angular i18n
        
        -   generate (boolean) : If true, generate Angular i18n code
            
        -   defaultLanguage (string) : Default language code
            
        -   files (string\[\]) : Translations files moved to assets/i18n (**support globs**)
            
        -   keywordsToRemove (string\[\]) : Keywords to remove from each file name (to make them look like language_code.json)
            
    -   noAngularJS : Configurations related to the removing of AngularJS
        
        -   keywordsToRemove (string\[\]) : Remove files from angular.json with those keywords in name
            
        -   toUpdate : Parts of angular.json to update
            
            -   assets (boolean) : If true, update assets
                
            -   scripts (boolean) : If true, update scripts
                
            -   styles (boolean) : If true, update styles
                
        -   removeUpgradeModule (boolean) : If true, remove UpgradeModule from the project
            
    -   lint: Configurations related to fix and lint
        
        -   files (string\[\]) : Files to analyse (**support folder and file name**)
            
        -   output (boolean) : If true, output errors and fixes
            
        -   auto : Auto mode : apply the first found fix. If not, ask for the fix to apply
            
            -   linter (boolean) : If true, use linter in auto mode
                
            -   fixer (boolean) : If true, use fixer in auto mode
                
        -   logFile (string) : Path of the generated log file
            
    -   tests : Configurations related to tests
        
        -   specsFolders (string\[\]) : Folders to look for specs files
            
        -   testFilesToInclude (string\[\]) : Files to include in test scripts (**support globs**)
            
        -   updateReportFolders (boolean) : If true, set report folders to project folder (can cause infinite loop in 'ng test' if not done)
            
        -   updatePolyfills (boolean) : If true, uncomment ES6 imports in polyfills.ts (can cause errors in older browsers if not done)
            

## Tool options

Each option can be used independently

  

| Short option | Long option | Description | 
|  ---- | ---- | ---- |
-I | --init | Launch config file generation (ignore other args)
-t | --ts |Launch TypeScript migration (install TypeScript, AngularJS types and generate tsconfig.json)
-C | --cli | Launch Angular CLI migration (install CLI, Angular dependencies, create needed files)
-u | --upgrade | Launch UpgradeModule migration (install module, create app module, install routing and i18n)
-d | --directives | Launch AngularJS tag directives migration (move to AngularJS components)
-a | --attributes | Launch AngularJS attribute directives migration (move to Angular directive)
-c | --components | Launch AngularJS components migration (move to Angular component)
-s | --services | Launch AngularJS services migration (move to Angular service)
-f | --filters | Launch AngularJS filters migration (move to Angular pipe)
-T | --tests | Launch tests migration (update karma config, update AngularJS specs for Upgrade Module, update angular.json)
-A | --all | Launch all previous options
-l | --lint | Launch lint and fix for components
-n | --angular | Remove AngularJS and UpgradeModule
-p \[path\] | --project \[path\] | Path to config file
||--no-verbose|Remove tool console logs
||--no-install|Same as 'noInstall: true' in config file
|-V||Output version number
-h||Output help

# Architecture

-   bin/
    
    -   migration-tool : Used for global use
        
-   config/
    
    -   config-file.ts : Interface for config file
        
    -   config.ts : Global helper to access configuration
        
    -   tslint.json : Configuration for lint
        
-   samples/ : Files used for code generation
    
    -   app.component.sample.ts : Sample app component
        
    -   app.module.sample.ts : Sample module
        
    -   component.sample.ts : Sample component
        
    -   component.spec.sample.ts : Sample component spec
        
    -   config.sample.json : Sample config file
        
    -   directive.sample.ts : Sample directive
        
    -   main.sample.ts : Sample main file
        
    -   service.sample.ts : Sample service
        
    -   tsconfig.sample.ts : Sample tsconfig
        
    -   upgraded-component.sample.ts : Sample component with UpgradeModule code (used for upgrade AngularJS component)
        
-   src/
    
    -   analysers/
        
        -   models/ : Models used for code analyses
            
        -   angularjs-component-analyser.ts : Generate an analyse of an AngularJS component from JS code
            
        -   attribute-directive-analyser.ts : Generate an analyse of an AngularJS attribute directive from JS code
            
        -   bracket-matcher.ts : Utils to find index of an ending bracket
            
        -   component-analyser.ts : Generate an analyse of an Angular component from AngularJS component and controller analyse
            
        -   controller-analyser.ts : Generate an analyse of an AngularJS controller from JS code
            
        -   directive-analyser.ts : Generate an analyse of an AngularJS tag directive from JS code
            
        -   injectable-analyser.ts : Generate an analyse of an Angular injectable from AngularJS service analyse
            
        -   service-analyser.ts : Generate an analyse of an AngularJS service from JS code
            
        -   unit-test-analyser.ts : Generate an analyse of an AngularJS spec file from JS code
            
    -   explainer/
        
        -   models/ : Markdown models
            
        -   explanation-generator.ts : Class for generating markdown file
            
    -   generators/
        
        -   component-generator.ts : Generate Angular code for component
            
        -   directive-generator.ts : Generate Angular code for directive
            
        -   spec-generator.ts : Generate Angular spec code
            
    -   migrators/
        
        -   angularcli-migrator.ts : Install Angular CLI, generate Angular files and install dependencies
            
        -   attribute-directive-migrator.ts : Migrate AngularJS attribute directives to Angular directives
            
        -   attribute-directive-to-angular.ts : Helper for migrator
            
        -   component-migrator.ts : Migrate AngularJS components to Angular components
            
        -   component-to-angular.ts : Helper for migrator
            
        -   directive-migrator.ts : Migrate AngularJS tag directives to AngularJS components
            
        -   directive-to-component.ts : Helper for migrator (generate component code)
            
        -   lint-migrator.ts : Handle lint and fix
            
        -   migrator.ts : Abstract class for each migrator, contains log generation, file handling and markdown generation
            
        -   noangularjs-migrator.ts : Handle AngularJS files deletion and removing of UpgradeModule
            
        -   service-migrator.ts : Migrate AngularJS services to Angular service
            
        -   service-to-injectable.ts : Helper for migrator
            
        -   tests-migrator.ts : Update AngularJS specs file, update test.ts, polyfills, karma config and angular.json
            
        -   typescript-migrator.ts : Install TS and AngularJS types
            
        -   upgrademodule-migrator.ts : Install UpgradeModule, generate app module, app component, routing code and i18n
            
    -   utils/
        
        -   lint/
            
            -   models/
                
                -   diagnostic-fixes.ts : Represent a diagnostic and a fix for TS
                    
                -   fix.ts : Represent a fix that can be applied
                    
                -   lint-rule.ts : Represent a fixable lint rule
                    
                -   position.ts : Represent a position in code
                    
                -   simplified-results.ts : Represent errors and fixes for a file
                    
                -   simplified-rule-failure.ts : Represent an error
                    
            -   rules/
                
                -   ImplicitAnyRule.ts : Rule to handle "implicit any" case
                    
                -   TripleEqualsRule.ts : Rule to handle "missing triple equal" case
                    
            -   fixer.ts : Abstract class for code fixing
                
            -   rule-factory.ts : Factory for rules
                
            -   tsfixer.ts : Get TS errors from TSServer and fix them
                
            -   tslinter.ts : Use TSLint lib to get lint errors and fix them
                
            -   tsserver.ts : Use TS compiler to get diagnostics for TS code
                
        -   data-extractor.ts : Class to extract content from HTML or JS
            
        -   data-remover.ts : Class to remove content in HTML or JS
            
        -   logger.ts : Class to extend for logging capacity
            
        -   npm-installator.ts : Class for managing NPM packages
            
        -   root-path.ts : Class to get the tool root path
            
        -   variable-factory.ts : Class to generate Variable
            
-   index.ts : Main file managing options, config load and migrations launching
    

# Bugs to look for

- [x] Gauge component template : too much $ctrl.
- [ ] Migrate md not generated
    

# Improvements

-   Export components to formal module
