import { RenderableTreeNode } from "@ext/markdown/core/render/logic/Markdoc";
import { StoredAnswer, StoredQuestion } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { QuestionType } from "@ext/markdown/elements/question/types";
import { JSONContent } from "@tiptap/core";

export const getStoredQuestionsByContent = (renderTree: RenderableTreeNode) => {
	const questions: Record<string, StoredQuestion> = {};

	const recursiveGetQuestions = (node: RenderableTreeNode | JSONContent | string) => {
		if (typeof node === "object" && "type" in node && node.type === "question") {
			questions[node.attrs.id] = {
				id: node.attrs.id,
				title: node.content?.[0]?.content?.[0]?.text ?? "",
				type: node.attrs.type as QuestionType,
				answers: node.content.reduce(
					(acc: Record<string, StoredAnswer>, answer: RenderableTreeNode | JSONContent) => {
						if (typeof answer !== "object" || !("attrs" in answer)) return acc;

						acc[answer.attrs.answerId] = {
							id: answer.attrs.answerId,
							value: false,
						};
						return acc;
					},
					{},
				),
				selectedAnswers: [],
				isRequired: node.attrs.required ?? false,
			};
		}

		if (typeof node === "object") {
			const content = "children" in node ? node.children : node.content;
			if (!content) return;
			content.forEach((content: RenderableTreeNode | JSONContent | string) => {
				recursiveGetQuestions(content);
			});
		}
	};

	recursiveGetQuestions(renderTree);
	return questions;
};
