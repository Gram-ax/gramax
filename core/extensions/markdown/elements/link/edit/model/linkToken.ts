import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import linkCreator from "../../render/logic/linkCreator";

function linkToken(context?: ParserContext) {
	return {
		mark: "link",
		getAttrs: (tok) => {
			if (!context) return { href: tok.attrGet("href"), hash: "", resourcePath: "" };
			const { href, resourcePath, hash, isFile } = linkCreator.getLink(tok.attrGet("href"), context);

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
