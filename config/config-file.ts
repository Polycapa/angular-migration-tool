/**
 * Interface for the configuration file
 * 
 * @export
 * @interface ConfigFile
 */
export interface ConfigFile {
  /**
   * Folder of the project
   * 
   * @type {string}
   * @memberof ConfigFile
   */
  projectFolder: string,
  /**
   * Folder of the source
   * 
   * @type {string}
   * @memberof ConfigFile
   */
  srcFolder: string,

  project: {
    /**
     * Project name
     * 
     * @type {string}
     */
    name: string,
    /**
     * Array of assets for the projects (insert in Angular CLI config)
     * 
     * @type {string[]}
     */
    assets: string[],
    /**
     * Project main module name
     * 
     * @type {string}
     */
    moduleName: string,
    /**
     * The selector for the app component
     * 
     * @type {string}
     */
    appComponentSelector: string,
    /**
     * Path to the karma config file
     * 
     * @type {string}
     */
    karmaConfig: string,
    /**
     * Path to the markdown file generated
     *
     * @type {string}
     */
    migrationReadme: string,
    tagDirectives: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * If binding injections are removed, add WARNING where used in code if true
       * 
       * @type {boolean}
       */
      generateUndeclaredWarning: boolean,
      /**
       * If binding injections are removed, replace where used in code by ctrl.${var} if true
       * 
       * @type {boolean}
       */
      updateRemovedInjectedBindings: boolean,
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Path to the router config
       * 
       * @type {string}
       */
      routerConfig: string
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string,
      /**
       * If true, generate upgrade code for AngularJS component
       * 
       * @type {boolean}
       */
      upgrade: boolean
    },
    attributeDirectives: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * If binding injections are removed, add WARNING where used in code if true
       * 
       * @type {boolean}
       */
      generateUndeclaredWarning: boolean,
      /**
       * If binding injections are removed, replace where used in code by ctrl.${var} if true
       * 
       * @type {boolean}
       */
      updateRemovedInjectedBindings: boolean,
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string
    },
    components: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Downgrade component if true
       * 
       * @type {boolean}
       */
      downgrade: boolean,
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string,
      /**
       * If true, add AngularJS injections as parameters in the new constructor
       * 
       * @type {boolean}
       */
      insertInjections: boolean
    },
    services: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string,
      /**
       * If true, add AngularJS injections as parameters in the new constructor
       * 
       * @type {boolean}
       */
      insertInjections: boolean,
      /**
       * Downgrade service if true
       *
       * @type {boolean}
       */
      downgrade: boolean,
    },
    filters: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string
    },
    controllers: {
      /**
       * Folder where generated files are created
       * 
       * @type {string}
       */
      generatedFilesFolder: string,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean,
      /**
       * Add prefix to generated files
       * 
       * @type {string}
       */
      generatedPrefix: string
    },
    constants: {
      /**
       * Generated file path
       * 
       * @type {string}
       */
      generatedFile: string,
      /**
       * Files to migrate
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * Output generated code in terminal if true
       * 
       * @type {boolean}
       */
      output: boolean
    },
    routing: {
      /**
       * If true, generate Angular routing code
       * 
       * @type {boolean}
       */
      generate: boolean,
      /**
       * Array of routes to insert. Each route contains the string path and the component class
       * 
       * @type {{
       *                 path: string,
       *                 component: any
       *             }[]}
       */
      routes: {
        path: string,
        component: any
      }[]
    },
    i18n: {
      /**
       * If true, generate Angular i18n code
       * 
       * @type {boolean}
       */
      generate: boolean,
      /**
       * Default language code for i18n
       * 
       * @type {string}
       */
      defaultLanguage: string,
      /**
       * Translations files to move (support glob)
       *
       * @type {string[]}
       */
      files: string[],
      /**
       * Remove these keywords in files name
       *
       * @type {string[]}
       */
      keywordsToRemove: string[]
    },
    noAngularJS: {
      /**
       * Remove files with those keywords in name
       * 
       * @type {string[]}
       */
      keywordsToRemove: string[],
      toUpdate: {
        /**
         * If true, update assets config
         * 
         * @type {boolean}
         */
        assets: boolean,
        /**
         * If true, update scripts config
         * 
         * @type {boolean}
         */
        scripts: boolean,
        /**
         * If true, update styles config
         * 
         * @type {boolean}
         */
        styles: boolean
      },
      /**
       * If true, remove UpgradeModule from project
       * 
       * @type {boolean}
       */
      removeUpgradeModule: boolean
    },
    lint: {
      /**
       * Files to lint
       * 
       * @type {string[]}
       */
      files: string[],
      /**
       * If true, output lint errors and fix
       * 
       * @type {boolean}
       */
      output: boolean,
      fix: {
        /**
         * If true, look for fixes
         * 
         * @type {boolean}
         */
        enabled: boolean,
        /**
         * Auto mode : apply the first found fix. If not, ask for the fix to apply
         */
        auto: {
          /**
           * If true, TSLinter is used in auto mode
           * 
           * @type {boolean}
           */
          linter: boolean,
          /**
           * If true, TSFixer (TS compiler) is used in auto mode
           * 
           * @type {boolean}
           */
          fixer: boolean
        }
      },
      /**
       * Path of the log file
       * 
       * @type {string}
       */
      logFile: string
    },
    tests: {
      /**
       * Folders with spec files to include
       *
       * @type {string[]}
       */
      specsFolders: string[],
      /**
       * Files to include in angular.json test config
       *
       * @type {string[]}
       */
      testFilesToInclude: string[],
      /**
       * If true, set report folders to project folder (can cause infinite loop in 'ng test' if not done)
       *
       * @type {boolean}
       */
      updateReportFolders: boolean,
      /**
       * If true, uncomment ES6 imports in polyfills.ts (can cause errors in older browsers if not done)
       *
       * @type {boolean}
       */
      updatePolyfills: boolean
    }
  },
  /**
   * If true, display npm log
   * 
   * @type {boolean}
   * @memberof ConfigFile
   */
  npmVerbose: boolean,
  /**
   * If true, only save dependencies to package.json in projectFolder
   * 
   * @type {boolean}
   * @memberof ConfigFile
   */
  noInstall: boolean
}
