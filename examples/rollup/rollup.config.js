import CivetPlugin from '../../dist/index.js';

export default {
  input: 'main.civet',
  output: {
    dir: 'dist',
    format: 'cjs',
  },
  plugins: [CivetPlugin.rollup({})],
};
