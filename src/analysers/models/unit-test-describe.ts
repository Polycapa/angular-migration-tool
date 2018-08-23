import { UnitTest } from './unit-test';
export class UnitTestDescribe extends UnitTest {
  private _title: string;
  private _body: string;
  private _children: UnitTest[];
  private _comments: string | undefined;


  constructor(title: string, body: string, children: UnitTest[] = [], comments?: string) {
    super();
    this._title = title;
    this._body = body;
    this._children = children;
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
   * Getter children
   * @return {UnitTest[]}
   */
  public get children(): UnitTest[] {
    return this._children;
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
   * Setter children
   * @param {UnitTest[]} value
   */
  public set children(value: UnitTest[]) {
    this._children = value;
  }

  /**
   * Setter comments
   * @param {string } value
   */
  public set comments(value: string | undefined) {
    this._comments = value;
  }

  public isDescribe() {
    return true;
  }
}
