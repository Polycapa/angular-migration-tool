import colors from 'colors';
import fs from 'fs-extra-promise';
import ts from 'typescript';
import { DiagnosticAndFixes } from './models/diagnostic-fixes';



export class TSServer {

  private readonly options: ts.CompilerOptions = {
    strict: true,
    noEmitOnError: true,
    noImplicitAny: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictPropertyInitialization: true,
    experimentalDecorators: true
  }

  private getHost(rootFileNames: string[], options: ts.CompilerOptions = this.options) {
    const files: ts.MapLike<{ version: number }> = {};

    rootFileNames.forEach(fileName => {
      files[fileName] = { version: 0 };
    });

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => rootFileNames,
      getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
      getScriptSnapshot: (fileName) => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }

        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => options,
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
    }
    return servicesHost;
  }

  private getService(rootFileNames: string[], options: ts.CompilerOptions = this.options) {
    // Create the language service files
    const service = ts.createLanguageService(this.getHost(rootFileNames, options), ts.createDocumentRegistry())
    return service;
  }

  getFilesDiagnostics(rootFileNames: string[], options: ts.CompilerOptions = this.options) {
    let diagnostics: ts.Diagnostic[] = [];
    for (const file of rootFileNames) {
      diagnostics = [
        ...diagnostics,
        ...this.getDiagnostics(file, options)
      ];
    }
    return diagnostics;
  }

  getDiagnostics(fileName: string, options: ts.CompilerOptions = this.options) {
    const service = this.getService([fileName], options);
    const allDiagnostics = [
      ...service.getCompilerOptionsDiagnostics(),
      ...service.getSyntacticDiagnostics(fileName),
      ...service.getSemanticDiagnostics(fileName),
      ...service.getSuggestionDiagnostics(fileName)
    ]
    return allDiagnostics;
  }

  getFilesDiagnosticsAndFixes(rootFileNames: string[], options: ts.CompilerOptions = this.options) {
    let items: DiagnosticAndFixes[] = [];
    for (const file of rootFileNames) {
      items = [
        ...items,
        ...this.getDiagnosticsAndFixes(file, options)
      ];
    }
    return items;
  }

  getDiagnosticsAndFixes(fileName: string, options: ts.CompilerOptions = this.options): DiagnosticAndFixes[] {
    const service = this.getService([fileName], options);
    const diagnostics = this.getDiagnostics(fileName, options);
    let items: DiagnosticAndFixes[] = [];

    for (const diagnostic of diagnostics) {
      let fixes: ts.CodeFixAction[] = [];
      if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        const start = diagnostic.start!;
        const end = start + diagnostic.length!;
        const diagnosticFixes = service.getCodeFixesAtPosition(
          fileName,
          start,
          end,
          [diagnostic.code],
          {},
          {}
        );
        fixes = [...diagnosticFixes];
      }
      const item: DiagnosticAndFixes = {
        diagnostic: diagnostic,
        fixes: fixes
      }
      items.push(item);
    }
    return items;
  }

  logFilesErrors(rootFileNames: string[], options: ts.CompilerOptions = this.options) {
    for (const file of rootFileNames) {
      this.logErrors(file, options);
    }
  }

  logErrors(fileName: string, options: ts.CompilerOptions = this.options) {
    const diagnostics = this.getDiagnostics(fileName, options);

    for (const diagnostic of diagnostics) {
      if (diagnostic.file) {
        const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const diagnosticType = this.getDiagnosticType(diagnostic.category);
        const fileName = diagnostic.file.fileName;

        const s = `[${diagnosticType}] [${fileName}] (${line + 1},${character + 1}) ${message}`;

        const color = this.getDiagnosticColor(diagnostic.category);
        console.log(color(s));

      }
      else {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        const diagnosticType = this.getDiagnosticType(diagnostic.category);

        const s = `[${diagnosticType}] ${message}`;

        const color = this.getDiagnosticColor(diagnostic.category);
        console.log(color(s));
      }
    }
  }

  getDiagnosticType(code: ts.DiagnosticCategory): string {
    switch (code) {
      case ts.DiagnosticCategory.Error:
        return "ERROR";
      case ts.DiagnosticCategory.Message:
        return "MESSAGE";
      case ts.DiagnosticCategory.Suggestion:
        return "SUGGESTION";
      case ts.DiagnosticCategory.Warning:
        return "WARNING";
    }
  }

  getDiagnosticColor(code: ts.DiagnosticCategory): colors.Color {
    switch (code) {
      case ts.DiagnosticCategory.Error:
        return colors.red;
      case ts.DiagnosticCategory.Message:
        return colors.white;
      case ts.DiagnosticCategory.Suggestion:
        return colors.blue;
      case ts.DiagnosticCategory.Warning:
        return colors.yellow;
    }
  }

}
