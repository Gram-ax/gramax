import Path from "@core/FileProvider/Path/Path";
import { span } from "@ext/loggers/opentelemetry";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import buildNavigationFromSpec from "@ext/markdown/elements/openApi/edit/logic/buildNavigationFromSpec";
import { registerOpenApiRefResources } from "@ext/markdown/elements/openApi/edit/logic/getAllRefs";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import * as yaml from "js-yaml";

const openApiToken = (context?: PrivateParserContext) => ({
	node: OPEN_API_NAME,
	getAttrs: async (tok) => {
		const showInfo = tok?.attrs.showInfo !== false && tok?.attrs.showInfo !== "false";
		if (!context) return { ...tok?.attrs, flag: tok?.attrs.flag === "true", showInfo };
		const rm = context.getResourceManager();

		const path = new Path(tok.attrs.src);

		let navigation = null;
		try {
			// Reading the spec belongs inside the try as well. getContent() returns null for a file that isn't
			// there, so the old unguarded .toString() threw, and that throw escaped into Parser.parse, which
			// wraps it in ParseError — the whole article turned into the "couldn't read the Markdown structure"
			// page instead of rendering the block, which is what reports a missing spec (U1).
			const content = (await rm.getContent(path))?.toString() ?? "";
			rm.set(path);

			const json = yaml.load(content);
			navigation = buildNavigationFromSpec(json);

			await registerOpenApiRefResources(path, rm, json);
		} catch (e) {
			const currentSpan = span();
			currentSpan?.addEvent("openapi-spec-parse-failed", { path: rm.getAbsolutePath(path).value });
			currentSpan?.recordException(e as Error);
		}

		return { ...tok?.attrs, flag: tok?.attrs.flag === "true", showInfo, navigation };
	},
});

export default openApiToken;
