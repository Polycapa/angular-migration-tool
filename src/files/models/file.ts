import fs from 'fs-extra-promise';
import { Path } from './path';

export class File {
  private _path!: Path;
  private cached: boolean;
  private _content = '';


  constructor(path: Path, cached: boolean = true) {
    this.path = path;
    this.cached = cached;
  }

  /**
   * Normalized path of the file
   *
   * @type {string}
   * @memberof File
   */
  public get path(): Path {
    return this._path;
  }

  public set path(path: Path) {
    const exist = fs.existsSync(path.value);
    if (exist) {
      if (path.isFile) {
        this._path = path;
      } else {
        throw new Error(`${path.value} is not a file`);
      }
    } else {
      throw new Error(`${path.value} doesn't exist`);
    }
  }

  /**
   * Test if content match the regular expression
   *
   * @private
   * @param {RegExp} exp Expression to test
   * @returns {boolean} True if String.match doesn't return null
   * @memberof File
   */
  private test(exp: RegExp): boolean {
    return this.content.match(exp) ? true : false;
  }

  /**
   * Detect if file is an AngularJS directive
   *
   * @returns {boolean} True if file is an AngularJS tag directive
   * @memberof File
   */
  public isAngularJSDirective(): boolean {
    const exp = /angular\s*\.module\(.*?\)\s*.directive/;
    return this.test(exp);
  }

  /**
   * Detect if file is an AngularJS tag directive
   *
   * @returns {boolean} True if file is an AngularJS tag directive
   * @memberof File
   */
  public isAngularJSTagDirective(): boolean {
    const exp = /restrict\s*:\s*('|").*?E.*?('|")/;
    if (this.isAngularJSDirective()) {
      return this.test(exp);
    }
    return false;
  }

  /**
   * Detect if file is an AngularJS attribute directive
   *
   * @returns {boolean} True if file is an AngularJS tag directive
   * @memberof File
   */
  public isAngularJSAttributeDirective(): boolean {
    const exp = /restrict\s*:\s*('|").*?A.*?('|")/;
    if (this.isAngularJSDirective()) {
      return this.test(exp);
    }
    return false;
  }

  /**
   * Detect if file is an AngularJS service
   *
   * @returns {boolean} True if file is an AngularJS service
   * @memberof File
   */
  public isAngularJSService(): boolean {
    const exp = /angular\s*\.module\(.*?\)\s*.service/;
    return this.test(exp);
  }

  /**
   * Detect if file is an AngularJS component
   *
   * @returns {boolean} True if file is an AngularJS service
   * @memberof File
   */
  public isAngularJSComponent(): boolean {
    const exp = /angular\s*\.module\(.*?\)\s*.component/;
    return this.test(exp);
  }

  /**
   * Detect if file is an AngularJS controller
   *
   * @returns {boolean} True if file is an AngularJS service
   * @memberof File
   */
  public isAngularJSController(): boolean {
    const exp = /angular\s*\.module\(.*?\)\s*.controller/;
    return this.test(exp);
  }

  /**
   * Detect if file is an AngularJS filter
   *
   * @returns {boolean} True if file is an AngularJS filter
   * @memberof File
   */
  public isAngularJSFilter(): boolean {
    const exp = /angular\s*\.module\(.*?\)(\s|.)*?.filter\(/;
    return this.test(exp);
  }

  /**
   * Detect if file is an AngularJS constant
   *
   * @returns {boolean} True if file is an AngularJS constant
   * @memberof File
   */
  public isAngularJSConstant(): boolean {
    const exp = /.constant\(/;
    return this.test(exp);
  }

  /**
   * Detect if file is an Angular service
   *
   * @returns {boolean} True if file is an Angular service
   * @memberof File
   */
  public isAngularService(): boolean {
    const exp = /@Injectable/;
    return this.test(exp);
  }

  /**
   * Detect if file is an Angular component
   *
   * @returns {boolean} True if file is an Angular component
   * @memberof File
   */
  public isAngularComponent(): boolean {
    const exp = /@Component/;
    return this.test(exp);
  }

  /**
   * Detect if file is an Angular directive
   *
   * @returns {boolean} True if file is an Angular directive
   * @memberof File
   */
  public isAngularDirective(): boolean {
    const exp = /@Directive/;
    return this.test(exp);
  }

  /**
   * Detect if file is a spec
   *
   * @returns {boolean} True if file is a spec
   * @memberof File
   */
  public isSpec(): boolean {
    const exp = /describe\(/;
    return this.test(exp);
  }

  /**
   * Load content of the file
   *
   * @memberof File
   */
  public load() {
    try {
      const content = fs.readFileSync(this.path.value, 'utf-8');
      this._content = content;
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Content of the file
   *
   * @readonly
   * @memberof File
   */
  public get content() {
    if ((this.cached && !this._content) || !this.cached) {
      this.load();
    }
    return this._content;
  }

  public toString(): string {
    return this.path.value;
  }
}
