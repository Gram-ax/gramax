import { Editor } from "@tiptap/core";
import t from "@ext/localization/locale/translate";
import { memo, useCallback, useEffect, useState } from "react";
import AiWritingPopover from "@ext/ai/components/AiWritingPopover";

const TextGenerateButton = ({ editor }: { editor?: Editor }) => {
	const [canOpen, setCanOpen] = useState(true);
	const [isOpen, setIsOpen] = useState(false);

	const onSubmit = useCallback(
		(command: string) => {
			if (!command?.length) return;
			editor?.commands.aiGenerate({
				command,
			});
		},
		[editor],
	);

	useEffect(() => {
		if (!editor) return;

		const onUpdateSelection = ({ editor }: { editor: Editor }) => {
			const isEmpty = editor.view.state.selection.empty;
			setCanOpen(isEmpty);

			if (!isEmpty) setIsOpen(false);
		};

		editor.on("selectionUpdate", onUpdateSelection);

		return () => {
			editor.off("selectionUpdate", onUpdateSelection);
		};
	}, [editor]);

	return (
		<AiWritingPopover
			editor={editor}
			triggerTooltipText={t("ai.generate")}
			triggerIcon="sparkles"
			contentPlaceholder={t("ai.placeholder.generate")}
			disabled={!canOpen}
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			toolbarSelector="[role='bottom-toolbar']"
			onSubmit={onSubmit}
		/>
	);
};

export default memo(TextGenerateButton);
