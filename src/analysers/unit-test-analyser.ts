import { DataExtractor } from '../utils/data-extractor';
import { BracketMatcher } from './bracket-matcher';
import { Code } from './models/code';
import { UnitTest } from './models/unit-test';
import { UnitTestBeforeEach } from './models/unit-test-before-each';
import { UnitTestDescribe } from './models/unit-test-describe';
import { UnitTestIt } from './models/unit-test-it';
import { UnitTestXit } from './models/unit-test-xit';


export class UnitTestAnalyser {
  private matcher = new BracketMatcher();
  analyse(js: string) {
    const code = this.findDescribe(js);
    if (!code) return;
    return this.analyseDescribe(code);
  }

  private findDescribe(js: string): Code | undefined {
    const exp = 'describe\\(';
    return this.find(js, exp);
  }

  private findBeforeEach(js: string): Code | undefined {
    const exp = 'beforeEach\\(';
    return this.find(js, exp);
  }

  private findXit(js: string): Code | undefined {
    const exp = 'xit\\(';
    return this.find(js, exp);
  }

  private findIt(js: string): Code | undefined {
    const exp = 'it\\(';
    return this.find(js, exp);
  }

  private find(js: string, exp: string): Code | undefined {
    const extractor = new DataExtractor();

    let reg = new RegExp(`(\\/\\/.*?(\n|\r)\\s*)?${exp}`);

    // Exp for all comments (single and multiline), but multiline exp is unexpectedly laggy
    // ((\\/\\/.*?(\n|\r)\\s*)|(\\/\\*([^*]|[\r\n]|(\\*+([^*/]|[\r\n])))*\\*+\\/(\n|\r)\\s*))


    const match = js.match(reg);


    if (!match) return;

    const comments = [
      ...extractor.extractMultilineJSComments(match[0]),
      ...extractor.extractJSComments(match[0])
    ];

    const comment = comments.length ? comments[0] : '';

    const expIndex = match.index!;

    if (expIndex === -1) return;

    const bracketIndex = expIndex + match[0].indexOf('(');
    const lastBracketIndex = this.matcher.match(js, '(', bracketIndex);
    const text = js.substring(expIndex, lastBracketIndex + 1);

    const code: Code = {
      content: text,
      start: expIndex,
      end: lastBracketIndex,
      docs: comment
    }

    return code;
  }

  private analyseDescribe(code: Code): UnitTestDescribe {
    const js = code.content;

    const title = js
      .substring(
        js.indexOf('(') + 2,
        js.indexOf(',') - 1
      )
      .replace(/^'/, '')
      .replace(/$'/, '');

    const body = js
      .substring(
        js.indexOf(',') + 1,
        js.length - 1
      )
      .trim()

    const functionBracketIndex = body.indexOf('{');
    const functionLastBracketIndex = this.matcher.match(body, '{', functionBracketIndex);

    let functionBody = body
      .substring(
        functionBracketIndex + 1,
        functionLastBracketIndex
      )
      .trim();

    let child: Code | undefined;
    let children: UnitTest[] = [];

    // Find all describe
    while (child = this.findDescribe(functionBody)) {
      let analysed = this.analyseDescribe(child);
      children.push(analysed);

      functionBody = functionBody.substring(0, child.start) + functionBody.substring(child.end + 2);
    }

    // Find all beforeEach
    while (child = this.findBeforeEach(functionBody)) {
      let analysed = this.analyseBeforeEach(child);
      children.push(analysed);

      functionBody = functionBody.substring(0, child.start) + functionBody.substring(child.end + 2);
    }

    // Find all xit
    while (child = this.findXit(functionBody)) {
      let analysed = this.analyseXit(child);
      children.push(analysed);

      functionBody = functionBody.substring(0, child.start) + functionBody.substring(child.end + 2);
    }

    // Find all it
    while (child = this.findIt(functionBody)) {
      let analysed = this.analyseIt(child);
      children.push(analysed);

      functionBody = functionBody.substring(0, child.start) + functionBody.substring(child.end + 2);
    }

    const describe = new UnitTestDescribe(title, functionBody.trim(), children, code.docs);

    return describe;
  }

  private analyseXit(code: Code): UnitTestXit {
    const js = code.content;

    const title = js
      .substring(
        js.indexOf('(') + 2,
        js.indexOf(',') - 1
      )
      .replace(/^'/, '')
      .replace(/$'/, '');

    const body = js
      .substring(
        js.indexOf(',') + 1,
        js.length - 1
      )
      .trim()

    const functionBracketIndex = body.indexOf('{');
    const functionLastBracketIndex = this.matcher.match(body, '{', functionBracketIndex);

    let functionBody = body
      .substring(
        functionBracketIndex + 1,
        functionLastBracketIndex
      )
      .trim();


    const xit = new UnitTestXit(title, functionBody, code.docs);

    return xit;
  }

  private analyseIt(code: Code): UnitTestIt {
    const js = code.content;

    const title = js
      .substring(
        js.indexOf('(') + 2,
        js.indexOf(',') - 1
      )
      .replace(/^'/, '')
      .replace(/$'/, '');

    const body = js
      .substring(
        js.indexOf(',') + 1,
        js.length - 1
      )
      .trim()

    const functionBracketIndex = body.indexOf('{');
    const functionLastBracketIndex = this.matcher.match(body, '{', functionBracketIndex);

    let functionBody = body
      .substring(
        functionBracketIndex + 1,
        functionLastBracketIndex
      )
      .trim();


    const it = new UnitTestIt(title, functionBody, code.docs);


    return it;
  }

  private analyseBeforeEach(code: Code): UnitTestBeforeEach {
    const js = code.content;

    const bracketIndex = js.indexOf('(');
    const lastBracketIndex = this.matcher.match(js, '(', bracketIndex);

    const body = js
      .substring(
        bracketIndex + 1,
        lastBracketIndex
      )
      .trim();

    const before = new UnitTestBeforeEach(body, code.docs);

    return before;
  }
}
