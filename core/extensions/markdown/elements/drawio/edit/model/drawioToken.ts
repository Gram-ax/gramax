function drawioToken() {
	return {
		node: "drawio",
		getAttrs: (tok) => {
			return { src: tok?.attrs?.path ?? "", title: tok?.attrs?.title ?? "" };
		},
	};
}

export default drawioToken;
