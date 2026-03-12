import generateUniqueID from "@core/utils/generateUniqueID";
import { findParentNode, type RawCommands } from "@tiptap/core";
import { editName } from "../../../consts";
import type { QuestionType } from "../../../types";
import { answerTypeByQuestionType } from "../answerTypeByQuestionType";

export const setQuestionType: RawCommands["setQuestionType"] =
	(type: QuestionType) =>
	({ commands }) => {
		return commands.command(({ tr, dispatch, editor }) => {
			const pos = tr.selection.from - 1;
			const parentNode = findParentNode((node) => node.type.name === editName)(tr.selection);
			if (!parentNode) return false;

			tr.setNodeAttribute(pos, "type", type);

			const isTextType = type === "text";

			if (!isTextType) {
				parentNode.node.content.forEach((node, offset) => {
					if (node.type.name !== "questionAnswer") return;
					tr.setNodeAttribute(pos + offset + 1, "type", answerTypeByQuestionType[type]);
					tr.setNodeAttribute(pos + offset + 1, "correct", null);
				});
			}

			if (isTextType) {
				let startPosOfAnswers: number;

				parentNode.node.content.forEach((answer, offset) => {
					if (answer.type.name !== "questionAnswer" || startPosOfAnswers) return;
					startPosOfAnswers = pos + offset;
				});

				if (startPosOfAnswers) {
					const questionAnswer = editor.schema.nodes.questionAnswer.create(
						{
							answerId: generateUniqueID(),
							correct: null,
							type: answerTypeByQuestionType[type],
							questionId: parentNode.node.attrs.id,
						},
						[editor.schema.nodes.paragraph.create()],
					);

					tr.replaceRangeWith(
						startPosOfAnswers,
						parentNode.pos + parentNode.node.nodeSize - 1,
						questionAnswer,
					);
				}
			}

			dispatch?.(tr);
			return true;
		});
	};
