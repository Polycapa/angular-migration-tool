import { DataExtractor } from './data-extractor';
export class DataRemover {

  /**
   * Remove all html tag
   * 
   * @param {string} html HTML to transform
   * @param {string} tag Tag to remove
   * @param {boolean} [endTag=true] True if tag have an end tag
   * @returns {string} Transformed html
   * @memberof DataRemover
   */
  removeHTMLTag(html: string, tag: string, endTag = true): string {
    let tagExp = endTag ? new RegExp(`\\s*<${tag}.*?\/${tag}>\\s*[\n|\r]`, 'gi') : new RegExp(`\\s*<${tag}.*?>\\s*[\n|\r]`, 'gi');
    return html.replace(tagExp, '');
  }

  /**
   * Remove tag with an attribute with specific data (or only with a specific attribute)
   * 
   * @param {string} html HTML to transform
   * @param {string} tag Tag to remove
   * @param {string} attribute Attribute to search for
   * @param {string} value Value to test (if empty, only search for tag)
   * @param {boolean} [endTag=true] True if tag have an end tag
   * @returns {string} Transformed html
   * @memberof DataRemover
   */
  removeHTMLTagWithAttributeData(html: string, tag: string, attribute: string, value: string, endTag = true): string {
    let s = html;
    let extractor = new DataExtractor();
    let matches = extractor.extractTagWithAttribute(html, tag, attribute, value, endTag);
    for (const match of matches) {
      let matchExp = new RegExp(`\\s*${match}\\s*[\n|\r]`);
      s = s.replace(matchExp, '');
    }
    return s;
  }

  /**
   * Remove HTML attribute
   * 
   * @param {string} html HTML to transform
   * @param {string} attribute Attribute to remove
   * @returns {string} Transformed html
   * @memberof DataRemover
   */
  removeHTMLAttribute(html: string, attribute: string): string {
    let s = html;
    let exp = new RegExp(`${attribute}(=".*?")?\\s*[\n|\r]`, 'g');
    return s.replace(exp, '');
  }

  /**
   * Remove empty lines (if number >= 2) and replace by \n
   * 
   * @param {string} s String to transform
   * @returns {string} Transformed string
   * @memberof DataRemover
   */
  removeEmptyLines(s: string): string {
    let blankLineExp = /^\s*(\r|\n){2,}/gm;
    return s.replace(blankLineExp, '\n');
  }

  /**
   * Remove HTML comments group
   * 
   * @param {string} html HTML to transform
   * @returns {string} Transformed html
   * @memberof DataRemover
   */
  removeAloneHTMLComments(html: string): string {
    let aloneHTMLCommentsExp = new RegExp('<!--.*?-->(?![\n|\r])\\s*', 'g');
    return html.replace(aloneHTMLCommentsExp, '');
  }

  /**
   * Remove JS comments
   * 
   * @param {string} js JS to transform
   * @returns {string} Transformed JS
   * @memberof DataRemover
   */
  removeJSComments(js: string): string {
    const commentsExp = new RegExp('\/\/.*?[\n|\r]\\s*', 'g');
    return js.replace(commentsExp, '');
  }

  /**
   * Remove multiline jS comments
   * 
   * @param {string} js JS to transform
   * @returns {string} Transformed JS
   * @memberof DataRemover
   */
  removeMultilineJSComments(js: string): string {
    const commentsExp = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g
    return js.replace(commentsExp, '');
  }

  /**
   * Remove {{}} brackets
   * 
   * @param {string} code Code to transform
   * @returns {string} Code with brackets
   * @memberof DataRemover
   */
  removeBindingBrackets(code: string): string {
    const bracketsExp = new RegExp('({{|}})', 'g');
    return code.replace(bracketsExp, '');
  }
}
