import compileTimeEnv from "../../scripts/compileTimeEnv.mjs";

const script = `window.getEnv = (name) => {
	return {
  ${Object.entries(compileTimeEnv.getBuiltInVariables())
		.map(([key, value]) => `		${key}: ${typeof value === "string" ? `"${value}"` : value}`)
		.join(",\n")}
	}[name];
};`;

console.error(script);
