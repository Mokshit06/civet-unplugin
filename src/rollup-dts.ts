import { Plugin } from 'rollup';
import ts from 'typescript';
import * as tsvfs from '@typescript/vfs';
import path from 'path';

const formatHost: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
  getCanonicalFileName: ts.sys.useCaseSensitiveFileNames
    ? f => f
    : f => f.toLowerCase(),
};

export const civetDtsPlugin = (options: { outDir: string }): Plugin => {
  let fsMap: Map<string, string> = new Map();
  let compilerOptions: any;

  return {
    name: 'rollup-civet-dts-plugin',
    async buildStart(options) {
      const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists);

      if (!configPath) {
        throw new Error("Could not find 'tsconfig.json'");
      }

      const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);

      if (error) {
        console.error(ts.formatDiagnostic(error, formatHost));
        throw error;
      }

      const configContents = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        process.cwd()
      );

      compilerOptions = {
        ...configContents.options,
        target: ts.ScriptTarget.ESNext,
      };
      fsMap = new Map();
    },
    buildEnd() {
      const system = tsvfs.createFSBackedSystem(fsMap, process.cwd(), ts);
      const host = tsvfs.createVirtualCompilerHost(system, compilerOptions, ts);
      const program = ts.createProgram({
        rootNames: [...fsMap.keys()],
        options: compilerOptions,
        host: host.compilerHost,
      });

      const sourceFiles = program.getSourceFiles();

      for (const sourceFile of sourceFiles) {
        program.emit(sourceFile, (filePath, content) =>
          this.emitFile({
            source: content,
            fileName: path.relative(process.cwd(), filePath),
            type: 'asset',
          })
        );
      }
    },
    async transform(code, id) {
      if (!/\.civet\.tsx?$/.test(id)) return null;

      fsMap.set(path.resolve(process.cwd(), id), code);
    },
  };
};
