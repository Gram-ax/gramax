import getAttrs from "@ext/markdown/elements/diagrams/logic/getAttrs";

const getEditToken = (name: string) => ({
	node: name,
	getAttrs: (tok) => getAttrs(tok.attrs),
});

export default getEditToken;
