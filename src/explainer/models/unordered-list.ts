import { GeneratedContent } from "./generated-content";

export class UnorderedList extends GeneratedContent {
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

    for (const child of this.children) {
      s += `${spaceString}- ${child.markdown()}`;
    }
    s += '\n';
    return s;
  }
}
