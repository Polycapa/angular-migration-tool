import { GeneratedContent } from "./generated-content";

export class UncheckedCheckbox extends GeneratedContent {
  markdown(): string {
    let s = `[ ] ${this.value}`;
    for (const child of this.children) {
      s += child.markdown();
    }
    s += '\n';
    return s;
  }
}
