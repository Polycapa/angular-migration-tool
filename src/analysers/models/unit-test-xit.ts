import { UnitTest } from './unit-test';

export class UnitTestXit extends UnitTest {
  private _title: string;
  private _body: string;
  private _comments: string | undefined;


  constructor(title: string, body: string, comments?: string) {
    super();
    this._title = title;
    this._body = body;
    this._comments = comments;
  }


  /**
   * Getter title
   * @return {string}
   */
  public get title(): string {
    return this._title;
  }

  /**
   * Getter body
   * @return {string}
   */
  public get body(): string {
    return this._body;
  }

  /**
   * Getter comments
   * @return {string }
   */
  public get comments(): string | undefined {
    return this._comments;
  }

  /**
   * Setter title
   * @param {string} value
   */
  public set title(value: string) {
    this._title = value;
  }

  /**
   * Setter body
   * @param {string} value
   */
  public set body(value: string) {
    this._body = value;
  }

  /**
   * Setter comments
   * @param {string } value
   */
  public set comments(value: string | undefined) {
    this._comments = value;
  }

  public isXit() {
    return true;
  }
}
