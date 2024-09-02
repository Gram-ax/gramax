function fenceToken() {
	return {
		block: "code_block",
		getAttrs: (tok) => ({ language: tok.info?.replace("none", "") }),
		noCloseToken: true,
	};
}

export default fenceToken;
