import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "rollup-plugin-typescript2";

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
		terser(),
	],
};
