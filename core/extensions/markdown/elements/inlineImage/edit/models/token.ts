import Path from "@core/FileProvider/Path/Path";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";

const inlineImageToken = (context: ParserContext) => {
	return {
		node: "inlineImage",
		getAttrs: (tok) => {
			if (!linkCreator.isExternalLink(tok.attrs.src)) context.getResourceManager().set(new Path(tok.attrs.src));

			return {
				src: tok?.attrGet ? tok.attrGet("src") : tok.attrs.src,
				alt: tok.children ? (tok.children[0] && tok.children[0].content) || null : tok.attrs.alt,
				width: tok?.attrGet ? tok.attrGet("width") : tok.attrs.width,
				height: tok?.attrGet ? tok.attrGet("height") : tok.attrs.height,
			};
		},
	};
};

export default inlineImageToken;
