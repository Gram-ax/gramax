import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import blockCommentTransformer from "@ext/markdown/elements/comment/edit/logic/blockCommentTransformer";
import htmlTransform from "@ext/markdown/elements/html/edit/logic/htmlTransform";
import htmlTagTransform from "@ext/markdown/elements/htmlTag/logic/htmlTagTransform";
import imageTransform from "@ext/markdown/elements/image/edit/logic/imageTransform";
import tableTransform from "@ext/markdown/elements/table/logic/tableTransform";
import type { Token } from "../../render/logic/Markdoc";
import type MarkdownParser from "../Parser";

type PreTransformerFuncProps = {
	tokens: Token[];
	context?: PrivateParserContext;
};

export type PreTransformerFunc = (props: PreTransformerFuncProps) => Token[];

const preTransformTokens = async ({
	tokens,
	context,
	parser,
}: PreTransformerFuncProps & { parser: MarkdownParser }) => {
	const transformers: PreTransformerFunc[] = [
		tableTransform,
		imageTransform,
		htmlTagTransform,
		htmlTransform,
		blockCommentTransformer,
	];

	await parser.events.emit("get-pre-transformers", {
		mutable: { preTransformers: transformers },
		context,
	});

	return transformers.reduce(
		async (acc, transformer) => await transformer({ tokens: await acc, context }),
		Promise.resolve(tokens),
	);
};

export default preTransformTokens;
