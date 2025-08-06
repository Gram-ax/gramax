import ButtonsLayout from "@components/Layouts/ButtonLayout";
import { Editor } from "@tiptap/core";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import Tooltip from "@components/Atoms/Tooltip";
import AiWritingPanel from "@ext/ai/components/AiWritingPanel";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";

const TooltipContentWrapper = styled.div`
	padding: 4px;
	color: var(--color-tooltip-text);
	border-radius: var(--radius-large);
	background: var(--color-tooltip-background);
`;

const TextGenerateButton = ({ editor }: { editor?: Editor }) => {
	const [canOpen, setCanOpen] = useState(false);

	const onSubmit = (command: string) => {
		editor?.commands.aiGenerate({
			command,
		});
	};

	useEffect(() => {
		if (!editor) return;

		const onUpdateSelection = ({ editor }: { editor: Editor }) => {
			setCanOpen(editor.view.state.selection.empty);
		};

		editor.on("selectionUpdate", onUpdateSelection);

		return () => {
			editor.off("selectionUpdate", onUpdateSelection);
		};
	}, [editor]);

	return (
		<ButtonsLayout>
			<Tooltip
				delay={[0, 250]}
				hideOnClick={undefined}
				trigger="focus mouseenter"
				appendTo="parent"
				interactive={canOpen}
				arrow={false}
				place="top"
				customStyle={canOpen}
				content={
					canOpen ? (
						<TooltipContentWrapper>
							<AiWritingPanel onSubmit={onSubmit} placeholder={t("ai.placeholder.generate")} />
						</TooltipContentWrapper>
					) : (
						t("ai.warning.generate-many-selection")
					)
				}
			>
				<Button icon="sparkles" disabled={!canOpen} />
			</Tooltip>
		</ButtonsLayout>
	);
};

export default TextGenerateButton;
