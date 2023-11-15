const getBasePath = (addEndSlash = false) => {
	return process.env.PRODUCTION === "false" || process.env.PRODUCTION === "false"
		? ""
		: "/storybook" + (addEndSlash ? "/" : "");
};

module.exports = getBasePath;
