const getViteEnvs = (): { [key: string]: string } => {
	const envs = (import.meta as any).env as { [key: string]: string };
	if (!envs) return {};
	const envPrefix = ["VITE", "TAURI", "GX"];
	const res = {};
	for (const [key, value] of Object.entries(envs)) {
		for (const prefix of envPrefix) {
			if (key.startsWith(prefix)) {
				res[key.slice(prefix.length + 1)] = value;
			}
		}
	}
	return res;
};

export default getViteEnvs();
