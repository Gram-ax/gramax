const heading = {
	block: "heading",
	getAttrs: (tok) => {
		let attrs = {};
		if (tok.attrs?.id) attrs = { id: tok.attrs.id, isCustomId: true };
		return { level: +tok.tag.slice(1), ...attrs };
	},
};

export default heading;
