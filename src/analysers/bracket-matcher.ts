export class BracketMatcher {
  match(text: string, char: string, index: number): number {
    let count = 0;
    let i: number;
    for (i = index; i < text.length; i++) {
      if (text.charAt(i) === char) {
        count++;
      } else if (text.charAt(i) === this.matchingChar(char)) {
        count--;
      }

      if (count === 0) {
        break;
      }
    }
    return i;
  }

  private matchingChar(char: string) {
    switch (char) {
      case '{':
        return '}';
      case '(':
        return ')';
      case '[':
        return ']';
    }
  }
}
