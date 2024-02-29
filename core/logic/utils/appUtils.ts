const S3_HOST = "https://s3.ics-it.ru/public/docreader";

const getUrl = async (platform: string, branch: string) => {
	const versions = await fetch(`${S3_HOST}/${branch}/versions.json`).then((res) => res.json());
	if (!versions?.[platform]) return undefined;
	return `${S3_HOST}/${branch}/${versions[platform]}`;
};

export const getDownloadUrl = (isDev: boolean, platform: string) => {
	return isDev ? getUrl(platform, "dev") : getUrl(platform, "release");
};
