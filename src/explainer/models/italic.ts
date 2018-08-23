import { GeneratedContent } from "./generated-content";

export class Italic extends GeneratedContent {
  markdown(): string {
    let s = '';
    for (const child of this.children) {
      s += child.markdown()
    }
    return `*${s}*`
  }
}
