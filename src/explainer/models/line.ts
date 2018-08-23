import { GeneratedContent } from "./generated-content";

export class Line extends GeneratedContent {
  markdown(): string {
    let s = this.value;
    for (const child of this.children) {
      s += child.markdown();
    }
    return `${s}\n`;
  }
}
