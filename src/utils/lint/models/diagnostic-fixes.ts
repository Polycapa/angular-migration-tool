import ts from 'typescript';
export interface DiagnosticAndFixes {
  diagnostic: ts.Diagnostic,
  fixes: ts.CodeFixAction[]
}
