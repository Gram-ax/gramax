const supportedVideoHostings = ["youtube.com", "youtu.be", "drive.google.com", "mega.nz", "rutube.ru", "dropbox.com"];

const isVideoSupported = (url: string) => {
	const videoPattern = new RegExp(`(${supportedVideoHostings.join("|")})`);
	return videoPattern.test(url);
};

export default isVideoSupported;
