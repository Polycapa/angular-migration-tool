import colors from 'colors';

export class Logger {
  private printColor: colors.Color;
  private tag: string;

  constructor(tag: string, printColor = colors.white) {
    this.tag = tag;
    this.printColor = printColor;
  }

  protected log(s: string, color = this.printColor) {
    let now = new Date();
    console.log(color(`${this.tag.bold} - ${now.toLocaleTimeString()} - ${s}`));
  }
}
