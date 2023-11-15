module.exports = {
	default: {
		paths: ["../tests/localApp/**/*.feature"],
		requireModule: ["ts-node/register"],
		require: ["src/**/*.ts"],
		format: ["@cucumber/pretty-formatter"],
		language: "ru",
		forceExit: true,
	},
};
