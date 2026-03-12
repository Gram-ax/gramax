import type TokenTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/TokenTransformerFunc";
import type { Token } from "@ext/markdown/core/render/logic/Markdoc";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import type { QuestionType } from "@ext/markdown/elements/question/types";

const getAttrs = (token) => {
	if (!token.attrs) return {};
	if (Array.isArray(token.attrs) && Array.isArray(token.attrs[0])) {
		const entries = token.attrs;
		return Object.fromEntries(entries);
	}
	return token.attrs || {};
};

const findQuestion = (tokens: Token[], id: number) => {
	for (let i = id; i >= 0; i--) {
		const token = tokens[i];

		if (token.type === "question_open") return { token, index: i };
	}
};

const findQuestionAnswers = (tokens: Token[], questionStartIndex: number) => {
	const answers: { token: Token; index: number }[] = [];

	for (let i = questionStartIndex + 1; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type === "question_close") break;

		if (token.type === "questionAnswer_open") {
			answers.push({ token, index: i });
		}
	}

	return answers;
};

const quizTokensTransformer: TokenTransformerFunc = ({ token, tokens, id }) => {
	if (token.type === "questionAnswer_open") {
		const attrs = getAttrs(token);
		const data = findQuestion(tokens, id);

		if (!data?.token) return;
		const { token: parent } = data;
		const parentAttrs = getAttrs(parent);
		const textToken = tokens[id + 2];
		const type = answerTypeByQuestionType[parentAttrs.type as QuestionType];
		const isNullAnswers = parentAttrs.isNullAnswers;

		const correctValue = type !== "text" ? (isNullAnswers ? null : attrs.correct === "true") : null;

		return {
			...token,
			attrs: {
				...attrs,
				title: type !== "text" ? textToken?.content : "",
				type,
				questionId: parentAttrs.id,
				correct: correctValue,
			},
		};
	}

	if (token.type === "question_open") {
		const attrs = getAttrs(token);
		const textToken = tokens[id + 2];

		const answers = findQuestionAnswers(tokens, id);
		let hasCorrectAnswers = false;

		for (const { token: answerToken } of answers) {
			const attrs = getAttrs(answerToken);
			if (attrs.correct === "true" || attrs.correct === true) {
				hasCorrectAnswers = true;
				break;
			}
		}

		tokens[id] = {
			...token,
			attrs: {
				...attrs,
				isNullAnswers: !hasCorrectAnswers,
			},
		};

		return {
			...token,
			attrs: {
				...attrs,
				title: textToken?.content,
				isNullAnswers: !hasCorrectAnswers,
				required: attrs.required === "true",
			},
		};
	}
};

export default quizTokensTransformer;
