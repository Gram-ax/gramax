import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import { QuestionType } from "@ext/markdown/elements/question/types";
import { Node } from "@tiptap/pm/model";
import { Editor } from "@tiptap/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";

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
				onClick={setRequired}
				selected={node.attrs.required}
				tooltipText={t("editor.question.required")}
			/>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<ActionButton icon="type" tooltipText={t("editor.question.types.name")} />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup onValueChange={setQuestionType} value={node.attrs.type}>
						<DropdownMenuRadioItem value="many">{t("editor.question.types.many")}</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value="one">{t("editor.question.types.one")}</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default QuestionActions;
