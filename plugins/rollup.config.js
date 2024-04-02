import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

export default {
	input: "src/index.ts",
	output: {
		file: "dist/bundle.js", // Имя выходного файла
		format: "es", // Формат ES6
	},
	plugins: [
		typescript(), // Плагин для компиляции TypeScript
		json(),
		resolve(), // Плагин для разрешения модулей
		commonjs(), // Плагин для поддержки CommonJS-модулей
	],
};
