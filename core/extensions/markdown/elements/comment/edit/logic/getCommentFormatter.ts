import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";
import { MarkSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";
import CommentProvider from "./CommentProvider";

const getCommentFormatter = (context?: ParserContext): MarkSerializerSpec => {
	if (!context) return { open: () => "", close: () => "" };
	const formatter = getFormatterType(context);

	const commentProvider = new CommentProvider(context.fp, context.getArticle().ref.path);

	return {
		open: async (_state, mark) => {
			if (!mark.attrs?.comment) return "";
			await commentProvider.saveComment(mark.attrs.count, mark.attrs as CommentBlock, context);
			return formatter.openTag("comment", { count: mark.attrs.count });
		},
		close(_, mark) {
			if (!mark.attrs?.comment) return "";
			return formatter.closeTag("comment");
		},
		mixable: true,
	};
};

export default getCommentFormatter;
