import { GeneratedContent } from "./generated-content";

export class Title extends GeneratedContent {
  private readonly level: number;

  constructor(content: string = '', level: number = 1) {
    super(content);
    this.level = level;
  }
  
  markdown(): string {
    let s = '';
    for (var i = 0; i < this.level; i++) {
      s += '#';
    }

    s += ` ${this.value}\n\n`;

    for (const child of this.children) {
      s += child.markdown();
    }

    return s;
  }
}
