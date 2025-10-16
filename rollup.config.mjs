// rollup.config.mjs
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

const external = ["d3"]; // keep d3 as peer dep (users include it themselves)

export default [
  // Core library (your existing exports)
  {
    input: "src/index.js",
    external,
    output: [
      { file: "dist/index.js",  format: "esm", sourcemap: true },
      { file: "dist/index.cjs", format: "cjs", sourcemap: true }
    ],
    plugins: [resolve(), commonjs()]
  },

  // Browser-friendly build for the single-function plotter
  {
    input: "src/plot/drawPhylogeny.js",
    external,
    output: [
      { file: "dist/drawPhylogeny.esm.js",  format: "esm",  sourcemap: true },
      { file: "dist/drawPhylogeny.cjs",     format: "cjs",  sourcemap: true },
      {
        file: "dist/drawPhylogeny.umd.js",
        format: "umd",
        name: "lwPhyloPlot",              // global exposed in <script> usage
        globals: { d3: "d3" },            // window.d3
        sourcemap: true,
        plugins: [terser()]
      }
    ],
    plugins: [resolve(), commonjs()]
  }
];

