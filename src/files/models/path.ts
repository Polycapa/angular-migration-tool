import fs from 'fs-extra-promise';
import path from 'path';

export class Path {
  private _value: string;

  constructor(value: string) {
    this._value = path.normalize(value);
  }

  public get value(): string {
    return this._value;
  }

  public set value(value: string) {
    this._value = path.normalize(value);
  }

  public withoutFilename(): string {
    try {
      if (this.isDirectory()) {
        return this.value;
      }
    } catch (e) { }
    return this.value.substring(0, this.value.lastIndexOf(path.sep));
  }

  public get key(): string {
    let key = this.value.substring(this.value.lastIndexOf(path.sep) + 1);
    key = key.substring(0, key.indexOf('.'));
    return key;
  }

  public get filename(): string {
    if (this.isDirectory()) {
      return '';
    }
    return this.value.substring(this.value.lastIndexOf(path.sep) + 1);
  }

  /**
   * Extension of the file
   *
   * @readonly
   * @type {string}
   * @memberof File
   */
  public get ext(): string | undefined {
    const sep = path.sep;
    const fileName = this.value.split(sep).pop() || '';
    const ext = fileName.indexOf('.') !== -1 ? fileName.split('.').pop() : '';
    return ext;
  }

  public isFile(): boolean {
    try {
      const isFile = fs.lstatSync(this.value).isFile();
      return isFile;
    } catch (error) {
      return !!this.ext;
    }
  }

  public isDirectory(): boolean {
    try {
      const isDirectory = fs.lstatSync(this.value).isDirectory();
      return isDirectory;
    } catch (e) {
      return !this.ext;
    }
  }

}
