// rollup.config.js
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.js",
  output: [
    { file: "dist/index.js", format: "esm", sourcemap: true },
    { file: "dist/index.cjs", format: "cjs", sourcemap: true, exports: "named" }
  ],
  plugins: [
    resolve(),
    commonjs(),
    terser() // minify both outputs
  ],
  // If you're ESM-only, you can drop the CJS block and the commonjs plugin.
};

