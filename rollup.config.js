import {terser} from "rollup-plugin-terser";
import * as meta from "./package.json";

const config = {
    input: "src/index.js",
    output: {
      file: `dist/${meta.name}.js`,
      name: "lwphylo",
      format: "umd",
      indent: false,
      extend: true,
      banner: `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author}`
    },
    plugins: [],
    onwarn(message, warn) {
      if (message.code === "CIRCULAR_DEPENDENCY") return;
      warn(message);
    }
  };
  
  export default [
    config,
    {
      ...config,
      output: {
        ...config.output,
        file: `dist/${meta.name}.min.js`
      },
      plugins: [
        ...config.plugins,
        terser({
          output: {
            preamble: config.output.banner
          }
        })
      ]
    }
  ];