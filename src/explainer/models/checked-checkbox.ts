import { GeneratedContent } from "./generated-content";

export class CheckedCheckbox extends GeneratedContent {
  markdown(): string {
    let s = `[x] ${this.value}`;
    for (const child of this.children) {
      s += child.markdown();
    }
    s += '\n';
    return s;
  }
}
