const { civetPlugin } = require('../../dist/index.js');
const { civetDtsPlugin } = require('../../dist/rollup-dts.js');

module.exports = {
  input: 'main.civet',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [
    civetPlugin.rollup({
      dts: true,
      stripTypes: false,
    }),
  ],
};
