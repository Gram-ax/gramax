import blockCommentTransformer from "@ext/markdown/elements/comment/edit/logic/blockCommentTransformer";
import htmlTransform from "@ext/markdown/elements/html/edit/logic/htmlTransform";
import htmlTagTransform from "@ext/markdown/elements/htmlTag/logic/htmlTagTransform";
import imageTransform from "@ext/markdown/elements/image/edit/logic/imageTransform";
import tableTransform from "@ext/markdown/elements/table/logic/tableTransform";
import { Token } from "../../render/logic/Markdoc";

const preTransformTokens = (tokens: Token[]) => {
	const transformers = [tableTransform, imageTransform, htmlTagTransform, htmlTransform, blockCommentTransformer];
	return transformers.reduce((acc, transformer) => transformer(acc), tokens);
};
export default preTransformTokens;
