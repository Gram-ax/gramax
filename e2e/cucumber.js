module.exports = {
	default: {
		failFast: true,
		paths: ["./features/**/*/*.feature"],
		require: ["./steps/**/*", "./models/**/*", "./setup/**/*"],
		requireModule: ["ts-node/register"],
		language: "ru",
		forceExit: true,
	},
};
