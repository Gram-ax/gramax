import child_process from "child_process";
const { execSync } = child_process;

const env = {
	GRAMAX_VERSION: null,
	BUGSNAG_API_KEY: null,
	PRODUCTION: null,
	SERVER_APP: null,
	SSO_SERVICE_URL: null,
	SSO_SERVICE_PUBLIC_KEY: null,
	BUGSNAG_CLIENT_KEY: null,
	BUGSNAG_SERVER_KEY: null,
	BRANCH: null,
	COOKIE_SECRET: null,
	SHARE_ACCESS_TOKEN: null,
	AUTH_SERVICE_URL: null,
	DIAGRAM_RENDERER_SERVICE_URL: null,
	REVIEW_SERVICE_URL: null,
	CORS_PROXY_SERVICE_URL: null,
	STORAGE_URL: null,
};

if (!process.env.COOKIE_SECRET) console.warn("WARNING: You need to set COOKIE_SECRET if you run gramax in production.");

const getBuiltInVariables = () => Object.keys(env).reduce((obj, x) => ({ ...obj, [x]: process.env[x] ?? env[x] }), {});

const setVersion = (platform) => {
	const commitCount = execSync('git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD', {
		shell: "bash",
	});
	const currentDate = execSync("date +%Y.%-m.%-d", { shell: "bash" });
	process.env.GRAMAX_VERSION = `${currentDate}-${platform}.${commitCount}`.replace("\n", "");
};

export default { getBuiltInVariables, setVersion };
