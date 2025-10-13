import resolveModule from "@app/resolveModule/frontend";

const openNewTab = (url: string) => {
	return resolveModule("openInWeb")(url);
};

export default openNewTab;
