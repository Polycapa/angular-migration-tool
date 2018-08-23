import { GeneratedContent } from "./generated-content";

export class Text extends GeneratedContent {
  markdown(): string {
    return this.value;
  }
}
