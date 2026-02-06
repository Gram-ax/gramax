import PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";

export const questionAnswerToken = (context?: PrivateParserContext) => ({
	block: "questionAnswer",
	getAttrs: (tok) => {
		const answer = {
			type: tok.attrs.type,
			questionId: tok.attrs.questionId,
			answerId: tok.attrs.answerId,
			correct: tok.attrs.correct,
		};

		const question = context?.questions.get(tok.attrs.questionId);
		if (!question) return answer;

		question.answers[tok.attrs.answerId] = {
			id: tok.attrs.answerId,
			title: tok.attrs.title,
			type: tok.attrs.type,
			correct: tok.attrs.correct,
		};

		return answer;
	},
});
