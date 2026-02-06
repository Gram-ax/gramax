import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import { editName } from "@ext/markdown/elements/question/consts";

export const questionToken = (context?: PrivateParserContext) => ({
	block: editName,
	getAttrs: (tok) => {
		const question = {
			id: tok.attrs.id,
			title: tok.attrs.title,
			type: tok.attrs.type,
			required: tok.attrs.required,
			answers: {},
		};
		if (context) context.questions.set(tok.attrs.id, question);
		return { id: tok.attrs.id, type: tok.attrs.type, required: tok.attrs.required };
	},
});
