import ActionButton from "@components/controls/HoverController/ActionButton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuRadioItem,
	DropdownMenuRadioGroup,
} from "@ui-kit/Dropdown";
import { Node } from "@tiptap/pm/model";
import { QuestionType } from "@ext/markdown/elements/question/types";
import { Editor } from "@tiptap/react";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import t from "@ext/localization/locale/translate";

interface QuestionActionsProps {
	node: Node;
	editor: Editor;
	getPos: () => number;
}
const QuestionActions = ({ node, getPos, editor }: QuestionActionsProps) => {
	const setQuestionType = (type: QuestionType) => {
		const pos = getPos();
		editor
			.chain()
			.focus(pos)
			.command(({ tr, dispatch }) => {
				node.content.forEach((answer, offset) => {
					if (answer.type.name !== "questionAnswer") return;
					tr.setNodeAttribute(pos + offset + 1, "type", answerTypeByQuestionType[type]);
					tr.setNodeAttribute(pos + offset + 1, "correct", false);
				});
				dispatch?.(tr);
				return true;
			})
			.updateAttributes(node.type, { type })
			.run();
	};

	const setRequired = () => {
		const pos = getPos();
		editor
			.chain()
			.focus(pos)
			.command(({ tr, dispatch }) => {
				tr.setNodeAttribute(pos, "required", !node.attrs.required);
				dispatch?.(tr);
				return true;
			})
			.run();
	};

	return (
		<>
			<ActionButton
				icon="check"
				tooltipText={t("editor.question.required")}
				onClick={setRequired}
				selected={node.attrs.required}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<ActionButton icon="type" tooltipText={t("editor.question.types.name")} />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup value={node.attrs.type} onValueChange={setQuestionType}>
						<DropdownMenuRadioItem value="many">{t("editor.question.types.many")}</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="one">{t("editor.question.types.one")}</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default QuestionActions;
