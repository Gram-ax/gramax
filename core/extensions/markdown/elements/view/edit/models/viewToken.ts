import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";

const viewToken = {
	node: "view",
	getAttrs: (tok) => {
		return {
			...new AttributeFormatter().parse(tok?.attrs),
		};
	},
};

export default viewToken;
