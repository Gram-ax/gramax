const S3_HOST = "https://s3.gram.ax";

export const getUrl = async (platform: string, branch: string) => {
	const versions = await fetch(`${S3_HOST}/${branch}/versions.json`).then((res) => res.json());
	if (!versions?.[platform]) return null;
	return `${S3_HOST}/${branch}/${versions[platform]}`;
};

export const getDownloadUrl = (isDev: boolean, platform: string) => {
	return isDev ? getUrl(platform, "dev") : getUrl(platform, "release");
};
