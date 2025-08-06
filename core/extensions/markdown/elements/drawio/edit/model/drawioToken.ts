import Path from "@core/FileProvider/Path/Path";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import getAttrs from "@ext/markdown/elements/diagrams/logic/getAttrs";

function drawioToken(context?: ParserContext) {
	return {
		node: "drawio",
		getAttrs: (tok) => {
			if (!context) return getAttrs(tok.attrs);
			const rm = context.getResourceManager();
			rm.set(new Path(tok.attrs.path));
			return getAttrs(tok.attrs);
		},
	};
}

export default drawioToken;
