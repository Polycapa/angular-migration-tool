export abstract class GeneratedContent {
  private content: string;
  children: GeneratedContent[] = [];

  constructor(content: string = '') {
    this.content = content;
  }

  get value(): string {
    return this.content;
  }

  set value(content: string) {
    this.content = content;
  }

  insert(...items: GeneratedContent[]) {
    for (const item of items) {
      this.children.push(item);
    }
  }

  abstract markdown(): string;
}
