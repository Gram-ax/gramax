require("ts-node").register();

module.exports = {
	default: {
		failFast: true,
		paths: ["./features/*/**/*.feature"],
		require: ["./steps/**/*", "./models/**/*", "./setup/**/*"],
		language: "ru",
		forceExit: true,
	},
};
