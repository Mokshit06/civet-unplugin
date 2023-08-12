import { TransformResult, createUnplugin } from 'unplugin';
import civet from '@danielx/civet';
import * as fs from 'fs';
import { load as loadHTML } from 'cheerio';
import path from 'path';

interface PluginOptions {
  outputTransformerPlugin?:
    | string
    | string[]
    | {
        build?: string | string[];
        serve?: string | string[];
      };
  outputExtension?: string;
  stripTypes?: boolean;
  transformOutput?: (
    code: string,
    id: string
  ) => TransformResult | Promise<TransformResult>;
}

const isCivet = (id: string) => /\.civet$/.test(id);
const isCivetTranspiled = (id: string) => /\.civet\.(m?)(j|t)s(x?)$/.test(id);

const removeNullChar = (id: string) => (id.startsWith('\0') ? id.slice(1) : id);

export const civetPlugin = createUnplugin((options: PluginOptions = {}) => {
  const stripTypes = options.stripTypes ?? !options.outputTransformerPlugin;
  const outExt = options.outputExtension ?? '.js';

  return {
    name: 'unplugin-civet',
    enforce: 'pre',
    resolveId(id, importer) {
      if (!isCivet(id)) return null;

      const absoluteId = path.isAbsolute(id)
        ? id
        : path.resolve(removeNullChar(path.dirname(importer ?? '')), id);
      const absolutePath = absoluteId + outExt;

      return '\0' + absolutePath;
    },
    loadInclude(id) {
      return isCivetTranspiled(id);
    },
    async load(id) {
      if (!isCivetTranspiled(id)) return null;

      // remove \0 and .js/jsx
      const filename = id.slice(1, -outExt.length);

      const code = await fs.promises.readFile(filename, 'utf-8');

      // Ideally this should have been done in a `transform` step
      // but for some reason, webpack seems to be running them in the order
      // of `resolveId` -> `loadInclude` -> `transform` -> `load`
      // so we have to do transformation here instead
      let transformed: TransformResult = {
        code: civet.compile(code, {
          inlineMap: true,
          filename: id,
          js: stripTypes,
        } as any) as string,
        map: null,
      };

      if (options.transformOutput)
        transformed = await options.transformOutput(transformed.code, id);

      return transformed;
    },
    vite: {
      config(config, { command }) {
        // Ensure esbuild runs on .civet files
        if (command === 'build') {
          return {
            esbuild: {
              include: [/\.civet$/],
              loader: 'tsx',
            },
          };
        }
      },
    },
  };
});

export default civetPlugin;
