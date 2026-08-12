// Canonicalizes git remote URLs so ssh/scp/https forms of the same repo compare equal:
// "git@host:g/r.git" | "https://host/g/r.git" | "ssh://git@host:2222/g/r" -> "host/g/r"
const normalizeGitUrl = (url: string | undefined): string | null => {
	if (!url) return null;
	let rest = url.trim();
	const scp = rest.match(/^[\w.-]+@([^:/]+):(.+)$/);
	if (scp) {
		rest = `${scp[1]}/${scp[2]}`;
	} else {
		rest = rest.replace(/^[a-z+]+:\/\//i, "");
		rest = rest.replace(/^[^@/]+@/, "");
	}
	rest = rest.replace(/^([^/]+):\d+\//, "$1/");
	rest = rest.replace(/\.git$/i, "");
	rest = rest.replace(/\/+$/, "");
	return rest.toLowerCase();
};

export default normalizeGitUrl;
