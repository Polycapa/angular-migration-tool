import glob from 'glob-promise';
import { File } from './models/file';
import { Path } from './models/path';

export class FilesFinder {

  /**
   * Return paths matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<string[]>} Array of paths
   * @memberof FilesFinder
   */
  async findPaths(search: string): Promise<string[]> {
    const files = await glob(search);
    return files;
  }

  /**
   * Return files matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findFiles(search: string): Promise<File[]> {
    let files: File[] = [];
    const paths = await this.findPaths(search);
    for (const path of paths) {
      let _path = new Path(path);
      try {
        files.push(new File(_path));
      } catch (e) {
        console.error(e.toString());
      }
    }
    return files;
  }

  /**
   * Return AngularJS directives matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSDirectives(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSDirective());
  }

  /**
   * Return AngularJS tag directives matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSTagDirectives(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSTagDirective());
  }

  /**
   * Return AngularJS attribute directives matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSAttributeDirectives(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSAttributeDirective());
  }

  /**
   * Return AngularJS services matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSServices(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSService());
  }

  /**
   * Return AngularJS components matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSComponents(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSComponent());
  }

  /**
   * Return AngularJS controllers matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSControllers(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSController());
  }

  /**
   * Return AngularJS filters matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSFilters(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSFilter());
  }

  /**
   * Return AngularJS constants matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularJSConstants(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.js');
    return files.filter(file => file.isAngularJSConstant());
  }

  /**
   * Return Angular components matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularComponents(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.ts');
    return files.filter(file => file.isAngularComponent());
  }

  /**
   * Return Angular services matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularServices(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.ts');
    return files.filter(file => file.isAngularService());
  }

  /**
   * Return Angular directives matching with search
   *
   * @param {string} search Glob to search for
   * @returns {Promise<File[]>} Array of files
   * @memberof FilesFinder
   */
  async findAngularDirectives(search: string): Promise<File[]> {
    const files = await this.findFiles(search + '/**/*.ts');
    return files.filter(file => file.isAngularDirective());
  }

  /**
   * Return TS files in folder
   *
   * @param {string} folder Folder to search for
   * @returns {Promise<File[]>} Array of TS files
   * @memberof FilesFinder
   */
  async findTypeScript(folder: string): Promise<File[]> {
    const files = await this.findFiles(folder + '/**/*.ts');
    return files;
  }

  /**
   * Find files related to an AngularJS directive
   *
   * @param {File} file Directive to look related files
   * @returns {(Promise<{
   *     controller: File | undefined,
   *     template: File | undefined,
   *     directiveSpec: File | undefined,
   *     controllerSpec: File | undefined,
   *     demoTemplate: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularJSDirectiveRelatedFiles(file: File): Promise<{
    controller: File | undefined,
    template: File | undefined,
    directiveSpec: File | undefined,
    controllerSpec: File | undefined,
    demoTemplate: File | undefined
  }> {
    if (!file.isAngularJSDirective()) {
      return {
        controller: undefined,
        template: undefined,
        directiveSpec: undefined,
        controllerSpec: undefined,
        demoTemplate: undefined
      }
    }
    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.{js,html}`);
    let controller: File | undefined,
      template: File | undefined,
      directiveSpec: File | undefined,
      controllerSpec: File | undefined,
      demoTemplate: File | undefined;

    for (const relatedFile of files) {
      if (relatedFile.isAngularJSController() && relatedFile.path.value.indexOf('demo') === -1) {
        controller = relatedFile;
      } else if (relatedFile.isSpec() && relatedFile.path.value.indexOf('directive') !== -1) {
        directiveSpec = relatedFile;
      } else if (relatedFile.isSpec() && relatedFile.path.value.indexOf('controller') !== -1) {
        controllerSpec = relatedFile;
      } else if (relatedFile.path.ext === 'html') {
        if (relatedFile.path.value.indexOf('demo') === -1) {
          template = relatedFile;
        } else {
          demoTemplate = relatedFile;
        }
      }
    }

    const related = {
      controller: controller,
      template: template,
      directiveSpec: directiveSpec,
      controllerSpec: controllerSpec,
      demoTemplate: demoTemplate
    }

    return related;
  }

  /**
   * Find files related to an AngularJS component
   *
   * @param {File} file Component to look related files
   * @returns {(Promise<{
   *     controller: File | undefined,
   *     template: File | undefined,
   *     componentSpec: File | undefined,
   *     controllerSpec: File | undefined,
   *     demoTemplate: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularJSComponentRelatedFiles(file: File): Promise<{
    controller: File | undefined,
    template: File | undefined,
    componentSpec: File | undefined,
    controllerSpec: File | undefined,
    demoTemplate: File | undefined
  }> {
    if (!file.isAngularJSComponent()) {
      return {
        controller: undefined,
        template: undefined,
        componentSpec: undefined,
        controllerSpec: undefined,
        demoTemplate: undefined
      };
    }

    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.{js,html}`);
    let controller: File | undefined,
      template: File | undefined,
      componentSpec: File | undefined,
      controllerSpec: File | undefined,
      demoTemplate: File | undefined;

    for (let relatedFile of files) {
      if (relatedFile.isAngularJSController() && relatedFile.path.value.indexOf('.demo') === -1) {
        controller = relatedFile;
      } else if (relatedFile.isSpec() && relatedFile.path.value.indexOf('.component') !== -1) {
        componentSpec = relatedFile;
      } else if (relatedFile.isSpec() && relatedFile.path.value.indexOf('.controller') !== -1) {
        controllerSpec = relatedFile;
      } else if (relatedFile.path.ext === 'html') {
        if (relatedFile.path.value.indexOf('.demo') === -1) {
          template = relatedFile;
        } else {
          demoTemplate = relatedFile;
        }
      }
    }

    const related = {
      controller: controller,
      template: template,
      componentSpec: componentSpec,
      controllerSpec: controllerSpec,
      demoTemplate: demoTemplate
    }

    return related;
  }

  /**
   * Find files related to an AngularJS controller
   *
   * @param {File} file Controller to look related files
   * @returns {(Promise<{
   *     template: File | undefined,
   *     controllerSpec: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularJSControllerRelatedFiles(file: File): Promise<{
    template: File | undefined,
    controllerSpec: File | undefined
  }> {
    if (!file.isAngularJSController()) {
      return {
        template: undefined,
        controllerSpec: undefined
      };
    }

    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.{js,html}`);
    let template: File | undefined,
      controllerSpec: File | undefined;

    for (const relatedFile of files) {
      if (relatedFile.isSpec() && relatedFile.path.value.indexOf('controller') !== -1) {
        controllerSpec = relatedFile;
      } else if (relatedFile.path.ext === 'html') {
        if (relatedFile.path.value.indexOf('demo') === -1) {
          template = relatedFile;
        }
      }
    }

    const related = {
      template: template,
      controllerSpec: controllerSpec
    }

    return related;
  }

  /**
   * Find files related to an AngularJS service
   *
   * @param {File} file Service to look related files
   * @returns {(Promise<{
   *     spec: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularJSServiceRelatedFiles(file: File): Promise<{
    spec: File | undefined
  }> {
    if (!file.isAngularJSService()) {
      return {
        spec: undefined
      }
    }
    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.{js,html}`);
    let spec: File | undefined;

    for (const relatedFile of files) {
      if (relatedFile.isSpec()) {
        spec = relatedFile;
      }
    }

    const related = {
      spec: spec
    }

    return related;
  }

  /**
   * Find files related to an AngularJS filter
   *
   * @param {File} file Filter file to look related files
   * @returns {(Promise<{
   *     spec: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularJSFilterRelatedFiles(file: File): Promise<{
    spec: File | undefined
  }> {
    if (!file.isAngularJSFilter()) {
      return {
        spec: undefined
      }
    }
    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.js`);
    let spec: File | undefined;

    for (const relatedFile of files) {
      if (relatedFile.isSpec()) {
        spec = relatedFile;
      }
    }

    const related = {
      spec: spec
    }

    return related;
  }

  /**
   * Find files related to an Angular component
   *
   * @param {File} file Component to look related files
   * @returns {(Promise<{
   *     template: File | undefined,
   *     spec: File | undefined,
   *     demoTemplate: File | undefined
   *   }>)}
   * @memberof FilesFinder
   */
  async findAngularComponentRelatedFiles(file: File): Promise<{
    template: File | undefined,
    spec: File | undefined,
    demoTemplate: File | undefined
  }> {
    if (!file.isAngularComponent()) {
      return {
        template: undefined,
        spec: undefined,
        demoTemplate: undefined
      }
    }

    const key = file.path.key;
    const folder = file.path.withoutFilename();
    const files = await this.findFiles(folder + `/**/*${key}*.{ts,html}`);
    let template: File | undefined,
      spec: File | undefined,
      demoTemplate: File | undefined;

    for (const relatedFile of files) {
      if (relatedFile.isSpec()) {
        spec = relatedFile;
      } else if (relatedFile.path.ext === 'html') {
        if (relatedFile.path.value.indexOf('demo') === -1) {
          template = relatedFile;
        } else {
          demoTemplate = relatedFile;
        }
      }
    }

    const related = {
      template: template,
      spec: spec,
      demoTemplate: demoTemplate
    }

    return related;
  }

}
