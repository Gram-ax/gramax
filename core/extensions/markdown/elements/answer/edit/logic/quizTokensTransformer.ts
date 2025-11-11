import TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";

const findQuestion = (tokens: any[], id: number) => {
	for (let i = id; i >= 0; i--) {
		const token = tokens[i];

		if (token.type === "question_open") return { token, index: i };
	}
};

const quizTokensTransformer: TokenTransformerFunc = ({ token, tokens, id }) => {
	if (token.type === "questionAnswer_open") {
		const attrs = Array.isArray(token.attrs?.[0]) ? Object.fromEntries(token.attrs) : token.attrs;

		const data = findQuestion(tokens, id);
		if (!data?.token) return;
		const { token: parent } = data;
		const textToken = tokens[id + 2];

		return {
			...token,
			attrs: {
				...(attrs || {}),
				title: textToken?.content || "",
				type: answerTypeByQuestionType[parent.attrs.type],
				questionId: parent.attrs.id,
				correct: attrs.correct === "true",
			},
		};
	}

	if (token.type === "question_open") {
		const attrs = Array.isArray(token.attrs?.[0]) ? Object.fromEntries(token.attrs) : token.attrs;
		const textToken = tokens[id + 2];

		return {
			...token,
			attrs: {
				...(attrs || {}),
				title: textToken?.content,
			},
		};
	}
};

export default quizTokensTransformer;
