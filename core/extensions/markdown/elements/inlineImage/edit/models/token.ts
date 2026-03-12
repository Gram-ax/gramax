import Path from "@core/FileProvider/Path/Path";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import { getRenderSrc } from "@ext/markdown/elements/image/edit/model/imageToken";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";

const inlineImageToken = (context: PrivateParserContext) => {
	return {
		node: "inlineImage",
		getAttrs: (tok) => {
			const isExternalLink = linkCreator.isExternalLink(tok.attrs.src);
			if (!isExternalLink) context.getResourceManager().set(new Path(tok.attrs.src));
			const renderSrc = isExternalLink ? tok.attrs.src : getRenderSrc(context, tok.attrs.src);

			return {
				src: tok?.attrGet ? tok.attrGet("src") : tok.attrs.src,
				alt: tok.children ? tok.children[0]?.content || null : tok.attrs.alt,
				width: tok?.attrGet ? tok.attrGet("width") : tok.attrs.width,
				height: tok?.attrGet ? tok.attrGet("height") : tok.attrs.height,
				renderSrc,
			};
		},
	};
};

export default inlineImageToken;
