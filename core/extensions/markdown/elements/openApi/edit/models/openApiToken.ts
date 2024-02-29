import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";

const openApiToken = {
	node: OPEN_API_NAME,
	getAttrs: (tok) => ({ ...tok?.attrs, flag: tok?.attrs.flag == "true" }),
};

export default openApiToken;
