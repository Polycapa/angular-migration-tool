import { UnitTest } from './unit-test';

export class UnitTestBeforeEach extends UnitTest {
  private _body: string;
  private _comments: string | undefined;


  constructor(body: string, comments?: string) {
    super();
    this._body = body;
    this._comments = comments;
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

  public isBeforeEach() {
    return true;
  }
}
