const detectPackageManager = (): "npm" | "yarn" | "pnpm" | "bun" => {
	const ua = process.env.npm_config_user_agent ?? "";

	if (/pnpm/i.test(ua)) return "pnpm";
	if (/yarn/i.test(ua)) return "yarn";
	if (/bun/i.test(ua)) return "bun";
	if (/npm/i.test(ua)) return "npm";

	if ((process.versions as any)?.bun) return "bun";
	return "npm";
};

export default detectPackageManager;
