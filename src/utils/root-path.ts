import path from 'path';

export class RootPath {
  static get path() {
    const basePath = path.dirname(require.main!.filename);
    return basePath
      .replace(/(\/|\\)bin/, '');
  }
}
