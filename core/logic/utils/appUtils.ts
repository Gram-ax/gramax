import Package from "../../../package.json";

const S3_HOST = "https://s3.ics-it.ru/public/docreader";

const getDevUrl = async (platform: string, branch: string) => {
	const versions = await fetch(`${S3_HOST}/${branch}/versions.json`).then((res) => res.json());
	if (!versions?.[platform]) return undefined;
	return `${S3_HOST}/${branch}/${versions[platform]}`;
};

export const getDownloadUrl = (isDev: boolean, platform: string, version: string) => {
	return isDev ? getDevUrl(platform, "dev") : getUrl(isDev) + getFileName(platform, version);
};

const getUrl = (isDev: boolean) => {
	return `https://s3.ics-it.ru/public/docreader/${isDev ? "dev" : "release"}/`;
};

const getFileName = (platform: string, version: string) => {
	const base = `DocReader-${version}`;
	if (platform == "mac-arm") return base + "-arm64.dmg";
	if (platform == "mac") return base + ".dmg";
	if (platform == "win") return base + ".exe";
	return null;
};

export const getVersion = async (isServerApp: boolean, submoduleBranchName: string): Promise<string> => {
	if (!isServerApp) return Package.version;
	const isDev = submoduleBranchName == "develop";
	return await getServerVersion(isDev);
};

export const getServerVersion = async (isDev: boolean): Promise<string> => {
	const url = getUrl(isDev) + "latest.txt";
	const res = await fetch(url);
	if (!res.ok) return null;
	return await res.text();
};
