import AiWritingPanel from "@ext/ai/components/AiWritingPanel";
import t from "@ext/localization/locale/translate";
import { PanelMenuComponentProps } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { useEffect } from "react";

const AiPanel = ({ closeHandler, editor }: PanelMenuComponentProps) => {
	const onSubmit = (command: string) => {
		editor.commands.aiPrettify({
			command,
		});
	};

	useEffect(() => {
		editor.commands.saveSelection();
	}, []);

	return <AiWritingPanel closeHandler={closeHandler} onSubmit={onSubmit} placeholder={t("ai.placeholder.prettify")} />;
};

export default AiPanel;
