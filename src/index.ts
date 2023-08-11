import { TransformResult, createUnplugin } from 'unplugin';
import civet from '@danielx/civet';
import * as fs from 'fs';
import { load as loadHTML } from 'cheerio';

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
const isCivetJS = (id: string) => /\.civet\.(js|ts)$/.test(id);

export const civetPlugin = createUnplugin((options: PluginOptions = {}) => {
  const stripTypes = options.stripTypes ?? !options.outputTransformerPlugin;
  const outputExtension = options.outputExtension ?? (stripTypes ? 'js' : 'ts');

  return {
    name: 'unplugin-civet',
    enforce: 'pre',
    resolveId(id) {
      if (!isCivet(id)) return null;

      const transformedId = `${id}.${outputExtension}`;

      return transformedId;
    },
    loadInclude(id) {
      return isCivetJS(id);
    },
    async load(id) {
      if (!isCivetJS(id)) return null;

      const filename = id.slice(0, -(1 + outputExtension.length));
      const code = await fs.promises.readFile(filename, 'utf-8');

      // Ideally this should have been done in a `transform` step
      // but for some reason, webpack seems to be running them in the order
      // of `resolveId` -> `loadInclude` -> `transform` -> `load`
      // so we have to do transformation here instead
      let transformed: TransformResult = {
        code: civet.compile(code, {
          inlineMap: true,
          filename: filename,
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
