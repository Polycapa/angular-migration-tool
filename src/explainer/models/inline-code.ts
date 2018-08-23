import { GeneratedContent } from "./generated-content";

export class InlineCode extends GeneratedContent {
  markdown(): string {
    return `\`${this.value}\``
  }
}
