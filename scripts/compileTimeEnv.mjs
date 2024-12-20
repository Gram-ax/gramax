/* global process */
import child_process from "child_process";
import * as fs from 'node:fs';
const { execSync } = child_process;

const env = {
	GRAMAX_VERSION: null,
	BUILD_VERSION: null,
	BUGSNAG_API_KEY: null,
	PRODUCTION: null,
	BUGSNAG_CLIENT_KEY: null,
	BRANCH: null,
	COOKIE_SECRET: null,
	SHARE_ACCESS_TOKEN: null,
	AUTH_SERVICE_URL: null,
	DIAGRAM_RENDERER_SERVICE_URL: null,
	REVIEW_SERVICE_URL: null,
	GIT_PROXY_SERVICE_URL: null,
	GEPS_URL: null,
	GES_URL: null,
};

if (process.env.PRODUCTION && !process.env.COOKIE_SECRET) console.warn("WARNING: You need to set COOKIE_SECRET if you run gramax in production.");

const getBuiltInVariables = () => Object.keys(env).reduce((obj, x) => ({ ...obj, [x]: process.env[x] ?? env[x] }), {});

const getVersionData = (filePath = "./gramaxVersionData.json") => {
	if (process.env.PRODUCTION && fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath))

	const commitCount = execSync('git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD', {
		shell: "bash",
	}).toString();
	const currentDate = execSync("date +%Y.%-m.%-d", { shell: "bash" }).toString();

	const versionData = { commitCount, currentDate };
	if (process.env.PRODUCTION) fs.writeFileSync(filePath, JSON.stringify(versionData))

	return versionData;
};

const generateVersion = (platform, filePath) => {
	const { commitCount, currentDate } = getVersionData(filePath);
	const version = `${currentDate}-${platform}.${commitCount}`.replaceAll("\n", "");
	return version;
}

const setVersion = (platform) => {
	const version = generateVersion(platform);
	process.env.GRAMAX_VERSION = version;
};

const setBuildVersion = (platform) => {
	const { commitCount, currentDate } = getVersionData();
	process.env.BUILD_VERSION = `${currentDate}-${platform}.${commitCount}`.replaceAll("\n", "");
};

export default { getBuiltInVariables, setVersion, setBuildVersion, generateVersion };
