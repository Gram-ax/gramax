import child_process from "child_process";
const { execSync } = child_process;

const names = [
	"ENTERPRISE_SERVER_URL",
	"GRAMAX_VERSION",
	"BUGSNAG_API_KEY",
	"PRODUCTION",
	"SERVER_APP",
	"BUGSNAG_CLIENT_KEY",
	"BUGSNAG_SERVER_KEY",
	"SUBMODULE_BRANCH_NAME",
];

const getBuiltInVariables = () => names.reduce((obj, x) => ({ ...obj, [x]: process.env[x] }), {});

const setVersion = (platform) => {
	const commitCount = execSync('git rev-list --count --date=local --after="$(date +"%Y-%m-01T00:00:00")" HEAD', {
		shell: "bash",
	});
	const currentDate = execSync("date +%Y.%-m.%-d", { shell: "bash" });
	process.env.GRAMAX_VERSION = `${currentDate}-${platform}.${commitCount}`.replace("\n", "");
};

export default { getBuiltInVariables, setVersion };
