import getAttrs from "@ext/markdown/elements/diagrams/logic/getAttrs";

function drawioToken() {
	return {
		node: "drawio",
		getAttrs: (tok) => {
			return getAttrs(tok.attrs);
		},
	};
}

export default drawioToken;
