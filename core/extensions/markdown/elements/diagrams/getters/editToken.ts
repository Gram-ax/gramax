import Path from "@core/FileProvider/Path/Path";
import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import getAttrs from "@ext/markdown/elements/diagrams/logic/getAttrs";

const getEditToken = (name: string) => (context?: PrivateParserContext) => ({
	node: name,
	getAttrs: (tok) => {
		if (!context) return getAttrs(tok.attrs);
		const rm = context.getResourceManager();
		rm.set(new Path(tok.attrs.path));
		return getAttrs(tok.attrs);
	},
});

export default getEditToken;
