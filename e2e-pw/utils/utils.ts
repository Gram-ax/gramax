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
