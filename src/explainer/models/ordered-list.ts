import { GeneratedContent } from "./generated-content";

export class OrderedList extends GeneratedContent {
  private readonly level: number;

  constructor(content: string = '', level: number = 0) {
    super(content);
    this.level = level;
  }

  markdown(): string {
    let s = this.value ? `${this.value}\n` : '';

    let spaceString = '';
    for (var i = 0; i < this.level; i++) {
      spaceString += ' ';
    }

    this.children.forEach((child, index) => {
      s += `${spaceString}${index + 1}. ${child.markdown()}`;
    })

    s += '\n';
    return s;
  }
}
