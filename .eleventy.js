const { minify } = require("html-minifier-terser");

/** @param {import('@11ty/eleventy/src/UserConfig')} config */
module.exports = function (config) {

  config.addPassthroughCopy('./src/js')
  
  if (process.env.NODE_ENV === "production") {
    config.addTransform("htmlmin", async function (content, outputPath) {
      if (outputPath && outputPath.endsWith(".html")) {
        let minified = await minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true,
          minifyCSS: true,
          customAttrCollapse: /d/,
        });
        return minified;
      }

      return content;
    });
  }
  return {
    dir: {
      input: "src",
    },
  };
};
