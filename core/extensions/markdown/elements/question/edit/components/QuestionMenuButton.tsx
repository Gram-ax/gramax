import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import Workspace from "@core-ui/ContextServices/Workspace";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { Icon } from "@ui-kit/Icon";

interface QuestionMenuButtonProps {
	editor: Editor;
}

const QuestionMenuButton = ({ editor }: QuestionMenuButtonProps) => {
	const workspace = Workspace.current();
	if (!workspace?.enterprise?.gesUrl || !workspace?.enterprise?.modules?.quiz) return null;
	const { disabled, isActive } = ButtonStateService.useCurrentAction({ action: "question" });

	return (
		<ToolbarDropdownMenuItem
			onClick={() =>
				editor
					.chain()
					.focus()
					.setQuestion({ options: { type: "one" } })
					.run()
			}
			active={isActive}
			disabled={disabled}
		>
			<div className="flex items-center gap-2">
				<Icon icon="file-question-mark" />
				{t("editor.question.name")}
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default QuestionMenuButton;
