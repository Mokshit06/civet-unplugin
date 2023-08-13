const { civetPlugin } = require('../../dist/index.js');
const { civetDtsPlugin } = require('../../dist/rollup-dts.js');

module.exports = {
  input: 'main.civet',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    // require('@rollup/plugin-typescript')(),

    civetPlugin.rollup({ stripTypes: false, outputExtension: '.ts' }),
    civetDtsPlugin({ outDir: 'dist' }),
    // require('rollup-plugin-dts').default(),
  ],
};
