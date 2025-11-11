import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import Workspace from "@core-ui/ContextServices/Workspace";

interface QuestionMenuButtonProps {
	editor: Editor;
}

const QuestionMenuButton = ({ editor }: QuestionMenuButtonProps) => {
	const workspace = Workspace.current();
	if (!workspace?.enterprise?.gesUrl || !workspace?.enterprise?.modules?.quiz) return null;

	const nodeValues = { action: "question" as NodeType };
	const { isActive, disabled } = ButtonStateService.useCurrentAction(nodeValues);

	return (
		<Button
			onClick={() =>
				editor
					.chain()
					.focus()
					.setQuestion({ options: { type: "one" } })
					.run()
			}
			icon="file-question-mark"
			disabled={disabled}
			isActive={isActive}
			tooltipText={t("editor.question.name")}
			nodeValues={nodeValues}
		/>
	);
};

export default QuestionMenuButton;
