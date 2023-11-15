module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	transform: {
		"^.+\\.jsx?$": "babel-jest",
		"^.+\\.(ts)x?$": [
			"jest-chain-transform",
			{
				transformers: [
					["ts-jest"],
					[
						"jest-ifdef-transform",
						{
							"ifdef-triple-slash": true,
							VITE_ENVIRONMENT: "next",
						},
					],
				],
			},
		],
	},
	testMatch: ["<rootDir>/**/*.test.ts"],
	testPathIgnorePatterns: [
		"<rootDir>/node_modules",
		"<rootDir>/core/extensions/markdown/core/render/logic/Markdoc",
		"<rootDir>/.next",
		"<rootDir>/public",
		"<rootDir>/docs",
		"<rootDir>/application",
		"<rootDir>/target/tauri",
	],
	reporters: ["default", ["jest-junit", { suiteName: "jest tests" }]],
	globals: {
		"ts-jest": { diagnostics: true, babelConfig: true },
	},
	moduleNameMapper: {
		"\\.(css|scss)$": "identity-obj-proxy",
		"^lodash-es(/(.*)|$)": "lodash$1",
		"^nanoid(/(.*)|$)": "nanoid$1",
		"^@components/(.*)$": "<rootDir>/core/components/$1",
		"^@core/(.*)$": "<rootDir>/core/logic/$1",
		"^@core-ui/(.*)$": "<rootDir>/core/ui-logic/$1",
		"^@ext/(.*)$": "<rootDir>/core/extensions/$1",
		"^@app/(.*)$": "<rootDir>/app/$1",
		"^@services/(.*)$": "<rootDir>/services/core/$1",
	},
	transformIgnorePatterns: [
		"<rootDir>/node_modules",
		"<rootDir>/.next",
		"<rootDir>/public",
		"<rootDir>/docs",
		"<rootDir>/application",
	],
	coveragePathIgnorePatterns: ["/node_modules/", "(.test)\\.(ts|tsx|js)$", "/distribution/.*\\.(ts|js)$"],
};
