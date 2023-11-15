module.exports = (w) => {
	return {
		files: [
			"!node_modules",
			{ pattern: "./**/*.test.ts", ignore: true },
			{ pattern: "./**/test/**/{.*,*}", load: false }, // test assets, в т.ч. те, которые начинаются с .
			"./**/*.ts",
			"./logic/VersionControl/git/diffMatchLib.js",
			"pages/**/*.ts",
		],
		tests: ["!node_modules", "!.next", "!public", "!docs", "./**/*.test.ts"],
		testFramework: "jest",
		env: {
			type: "node",
		},
		compilers: {
			"**/*.js": w.compilers.babel({
				presets: [["@babel/preset-env", { modules: "commonjs" }]],
			}),
			"**/*.ts": w.compilers.typeScript({ module: "commonjs" }),
		},
		debug: true,
	};
};
