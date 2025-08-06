import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import linkCreator from "../../render/logic/linkCreator";

function linkToken(context?: ParserContext) {
	return {
		mark: "link",
		getAttrs: async (tok) => {
			if (!context) return { href: tok.attrGet("href"), hash: "", resourcePath: "" };
			const { href, resourcePath, hash, isFile } = await linkCreator.getLink(tok.attrGet("href"), context);

			if (resourcePath) {
				if (isFile) context.getResourceManager().set(resourcePath);
				else context.getLinkManager().set(resourcePath, hash);
			}
			return {
				href,
				isFile,
				hash: hash ?? "",
				resourcePath: resourcePath?.value ?? "",
			};
		},
	};
}

export default linkToken;
