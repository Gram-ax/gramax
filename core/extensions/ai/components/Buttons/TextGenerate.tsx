import AiWritingPopover from "@ext/ai/components/AiWritingPopover";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { memo, useCallback, useEffect, useState } from "react";

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
			contentPlaceholder={t("ai.placeholder.generate")}
			disabled={!canOpen}
			editor={editor}
			isOpen={isOpen}
			onSubmit={onSubmit}
			setIsOpen={setIsOpen}
			toolbarSelector="[role='bottom-toolbar']"
			triggerIcon="sparkles"
			triggerTooltipText={t("ai.generate")}
		/>
	);
};

export default memo(TextGenerateButton);
