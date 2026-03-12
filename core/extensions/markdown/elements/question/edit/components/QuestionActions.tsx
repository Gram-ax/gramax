import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import type { QuestionType } from "@ext/markdown/elements/question/types";
import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
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
		editor
			.chain()
			.focus(getPos() + 1)
			.setQuestionType(type)
			.run();
	};

	const setRequired = () => {
		editor
			.chain()
			.focus(getPos() + 1)
			.setQuestionRequired(!node.attrs.required)
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
						<DropdownMenuRadioItem value="text">{t("editor.question.types.text")}</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default QuestionActions;
