const getEditToken = (name: string) => ({
	node: name,
	getAttrs: (tok) => {
		return { src: tok?.attrs?.path ?? "", title: tok?.attrs?.title ?? "" };
	},
});

export default getEditToken;
