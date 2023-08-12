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

export const civetPlugin = createUnplugin((options: PluginOptions = {}) => {
  const stripTypes = options.stripTypes ?? !options.outputTransformerPlugin;

  return {
    name: 'unplugin-civet',
    enforce: 'pre',
    loadInclude(id) {
      return isCivet(id);
    },
    async load(id) {
      if (!isCivet(id)) return null;

      const code = await fs.promises.readFile(id, 'utf-8');

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
