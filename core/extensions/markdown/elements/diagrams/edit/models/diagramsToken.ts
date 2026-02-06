import Path from "@core/FileProvider/Path/Path";
import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";

const diagramsToken = (context?: PrivateParserContext) => ({
	node: "diagrams",
	getAttrs: (tok) => {
		if (!context) return tok?.attrs;
		const rm = context.getResourceManager();
		rm.set(new Path(tok.attrs.path));
		return tok?.attrs;
	},
});

export default diagramsToken;
