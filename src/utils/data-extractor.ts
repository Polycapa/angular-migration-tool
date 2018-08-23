export class DataExtractor {
  /**
   * Extract attribute data from HTML tag
   * 
   * @param {string} html HTML to find tag in
   * @param {string} tag Tag to search for
   * @param {string} attribute Attribute where to extract data
   * @param {boolean} [endTag=true] True if tag have an end tag
   * @returns {string[]} Array of extracted data
   * @memberof DataExtractor
   */
  extractHTMLAttribute(html: string, tag: string, attribute: string, endTag = true): string[] {
    let datas: string[] = [];
    let tagExp = endTag ? new RegExp(`<${tag}.*?\/${tag}>`, 'g') : new RegExp(`<${tag}.*?>`, 'g');
    let attributeExp = new RegExp(`${attribute}=".*?"`, 'g');
    let matches = html.match(tagExp);
    if (matches) {
      for (let match of matches) {
        // Remove attribute and ="
        let attributeDatas = match.match(attributeExp);
        if (attributeDatas) {
          for (let data of attributeDatas) {
            data = data.substring(attribute.length + 2);
            // Remove last "
            data = data.substring(0, data.length - 1);
            datas.push(data);
          }
        }
      }
    }
    return datas;
  }

  /**
   * Extract data with an attribute with specific value (or all tags with this attribute if value is empty)
   * 
   * @param {string} html HTML to find tag in
   * @param {string} tag Tag to search for
   * @param {string} attribute Attribute where to search data
   * @param {string} value Value to search
   * @param {boolean} [endTag=true] True if tag have an end tag
   * @returns {string[]} Array of tag
   * @memberof DataExtractor
   */
  extractTagWithAttribute(html: string, tag: string, attribute: string, value: string, endTag = true): string[] {
    let datas: string[] = [];
    let tagExp = endTag ? new RegExp(`<${tag}.*?\/${tag}>`, 'g') : new RegExp(`<${tag}.*?>`, 'g');
    let attributeExp = new RegExp(`${attribute}=".*?"`, 'g');
    let matches = html.match(tagExp);
    if (matches) {
      for (let match of matches) {
        // Remove attribute and ="
        let attributeDatas = match.match(attributeExp);
        if (attributeDatas) {
          for (let data of attributeDatas) {
            data = data.substring(attribute.length + 2);
            // Remove last "
            data = data.substring(0, data.length - 1);
            if (data === value || !value) datas.push(match);
          }
        }
      }
    }
    return datas;
  }

  /**
   * Extract multiline JS comments
   * 
   * @param {string} js JS to analyse
   * @returns {string[]} Comments
   * @memberof DataExtractor
   */
  extractMultilineJSComments(js: string): string[] {
    const commentsExp = /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g
    return js.match(commentsExp) || [];
  }

  extractJSComments(js: string): string[] {
    const commentsExp = /(\/\/.*?(\n|\r)\s*)/g
    return js.match(commentsExp) || [];
  }
}
