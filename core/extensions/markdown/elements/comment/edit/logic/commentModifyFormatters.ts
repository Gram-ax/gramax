import { getFormatterTypeByContext } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";

const commentModifyFormatters = (
	formatters: { [node: string]: NodeSerializerSpec },
	context?: PrivateParserContext,
) => {
	const formatter = getFormatterTypeByContext(context);

	Object.keys(formatters).forEach((nodeType) => {
		const originalFormatter = formatters[nodeType];

		formatters[nodeType] = async (state, node, ...args): Promise<void> => {
			if (!node.attrs?.comment?.id) return originalFormatter(state, node, ...args);

			const comment = node.attrs.comment;
			const commentId = comment.id;
			const isInline = node.isInline;

			state.write(formatter.openTag("comment", { id: commentId }, true) + (isInline ? "" : "\n\n"));
			await originalFormatter(state, node, ...args);
			state.write(formatter.closeTag("comment") + (isInline ? "" : "\n\n"));
		};
	});

	return formatters;
};

export default commentModifyFormatters;
