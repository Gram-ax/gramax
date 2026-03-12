export const env = (name: string, message = `required`): string => {
	const val = process.env[name];
	if (!val) {
		const error = new Error(`${name}: ${message}`);
		Error.captureStackTrace(error, env);
		throw error;
	}

	return val;
};

env.optional = (name: string) => {
	return process.env[name] || null;
};

export const sleep = async (ms: number) => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

export function md(strings: TemplateStringsArray, ...values: unknown[]): string {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += String(values[i]) + strings[i + 1];
	}
	const lines =
		result
			?.replace(/^\n/, "")
			.replace(/\n[ \t]*$/, "")
			.split("\n") || [];
	const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)?.[0]?.length || 0));
	return lines.map((l) => l.slice(indent)).join("\n");
}
