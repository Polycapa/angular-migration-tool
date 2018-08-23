import { Bold } from './models/bold';
import { CheckedCheckbox } from './models/checked-checkbox';
import { Chip } from './models/chip';
import { Code } from './models/code';
import { EmptyLine } from './models/empty-line';
import { GeneratedContent } from "./models/generated-content";
import { InlineCode } from './models/inline-code';
import { Italic } from './models/italic';
import { Line } from './models/line';
import { OrderedList } from './models/ordered-list';
import { Paragraph } from './models/paragraph';
import { Text } from './models/text';
import { Title } from './models/title';
import { UncheckedCheckbox } from './models/unchecked-checkbox';
import { UnorderedList } from './models/unordered-list';

export class ExplanationGenerator {
  private static _instance: ExplanationGenerator;
  private texts: GeneratedContent[] = [];

  private constructor() { }
  
  static get instance(): ExplanationGenerator {
    if (!this._instance) {
      this._instance = new ExplanationGenerator();
    }
    return this._instance;
  }
  
  generateMarkdown(): string {
    let s = '';
    for (const text of this.texts) {
      s += `${text.markdown()}\n`;
    }
    return s;
  }

  create(
    type: string,
    content: string = '',
    level: number = 0
  ): GeneratedContent {
    type = type.toLowerCase();
    switch (type) {
      case 'title':
        return new Title(content, level);
      case 'unordered-list' || 'unsorted-list':
        return new UnorderedList(content, level);
      case 'ordered-list' || 'sorted-list':
        return new OrderedList(content, level);
      case 'chip':
        return new Chip(content);
      case 'paragraph':
        return new Paragraph(content);
      case 'line':
        return new Line(content);
      case 'empty':
        return new EmptyLine();
      case 'bold':
        return new Bold(content);
      case 'italic':
        return new Italic(content);
      case 'text':
        return new Text(content);
      case 'unchecked-checkbox':
        return new UncheckedCheckbox(content);
      case 'checked-checkbox':
        return new CheckedCheckbox(content);
      case 'inline-code':
        return new InlineCode(content);
      case 'code':
        return new Code(content);
      default:
        throw new Error(`${type} is an unknown type`);
    }
  }

  add(
    type: string,
    content: string = '',
    level: number = 1
  ) {
    const item = this.create(type, content, level);
    if (item) {
      this.texts.push(item);
      return item;
    }
  }

  insertIn(item: GeneratedContent, ...texts: (GeneratedContent | undefined)[]) {
    for (const text of texts) {
      if (text) {
        item.insert(text);
      }
    }
  }

  insert(...texts: (GeneratedContent | undefined)[]) {
    for (const text of texts) {
      if (text) {
        this.texts.push(text);
      }
    }
  }

  buildMarkdown(...items: ({ type: string, content?: string, level?: number } | string)[]) {
    let s = '';
    for (const item of items) {
      s += typeof item === 'string' ? item : this.create(item.type, item.content, item.level).markdown();
    }
    return s;
  }
}
