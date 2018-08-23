import { GeneratedContent } from "./generated-content";

export class Paragraph extends GeneratedContent {
  markdown(): string {
    return `\n${this.value}\n`;
  }
}
