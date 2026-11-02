// Generate with Prisma's WASM schema parser and JavaScript client generator.
// No native schema/query engine or verification bypass is needed for generation.
const { getGenerators } = require("@prisma/internals");
(async () => {
  const generators = await getGenerators({
    schemaPath: "prisma/schema.prisma",
    providerAliases: {
      "prisma-client-js": {
        generatorPath:
          require.resolve("@prisma/client/generator-build/index.js"),
        isNode: true,
      },
    },
  });
  try {
    for (const generator of generators) await generator.generate();
  } finally {
    for (const generator of generators) generator.stop();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
