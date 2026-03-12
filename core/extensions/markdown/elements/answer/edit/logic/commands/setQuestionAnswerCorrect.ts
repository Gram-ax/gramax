import type { QuizCorrect } from "@ext/markdown/elements/question/types";
import { findParentNode, type RawCommands } from "@tiptap/core";
import { editName } from "../../../consts";

export const setQuestionAnswerCorrect: RawCommands["setQuestionAnswerCorrect"] =
	(correct: QuizCorrect) =>
	({ commands, tr }) => {
		const parentNode = findParentNode((node) => node.type.name === editName)(tr.selection);
		if (!parentNode) return false;
		return commands.command(({ tr }) => {
			tr.setNodeAttribute(parentNode.pos, "correct", correct);
			return true;
		});
	};
