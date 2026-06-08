import Path from "@core/FileProvider/Path/Path";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import buildNavigationFromSpec from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import * as yaml from "js-yaml";

const openApiToken = (context?: PrivateParserContext) => ({
	node: OPEN_API_NAME,
	getAttrs: async (tok) => {
		if (!context) return { ...tok?.attrs, flag: tok?.attrs.flag === "true" };
		const rm = context.getResourceManager();

		const path = new Path(tok.attrs.src);
		const content = (await rm.getContent(path)).toString();
		rm.set(path);

		let navigation = null;
		try {
			const json = yaml.load(content);
			navigation = buildNavigationFromSpec(json);
		} catch (e) {
			console.error(`YAML parse error in ${rm.getAbsolutePath(path)}`, e);
		}

		return { ...tok?.attrs, flag: tok?.attrs.flag === "true", navigation };
	},
});

export default openApiToken;
