import { GeneratedContent } from "./generated-content";

export class Code extends GeneratedContent {
  markdown(): string {
    return `
    \`\`\`javascript
    ${this.value}
    \`\`\``
  }
}
