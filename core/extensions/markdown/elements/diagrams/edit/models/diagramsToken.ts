import Path from "@core/FileProvider/Path/Path";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";

const diagramsToken = (context?: ParserContext) => ({
	node: "diagrams",
	getAttrs: (tok) => {
		if (!context) return tok?.attrs;
		const rm = context.getResourceManager();
		rm.set(new Path(tok.attrs.path));
		return tok?.attrs;
	},
});

export default diagramsToken;
