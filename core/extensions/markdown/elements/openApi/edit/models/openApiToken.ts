import Path from "@core/FileProvider/Path/Path";
import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";

const openApiToken = (context?: PrivateParserContext) => ({
	node: OPEN_API_NAME,
	getAttrs: (tok) => {
		if (!context) return { ...tok?.attrs, flag: tok?.attrs.flag == "true" };
		const rm = context.getResourceManager();
		rm.set(new Path(tok.attrs.src));
		return { ...tok?.attrs, flag: tok?.attrs.flag == "true" };
	},
});

export default openApiToken;
