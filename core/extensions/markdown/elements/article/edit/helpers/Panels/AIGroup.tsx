import ButtonsLayout from "@components/Layouts/ButtonLayout";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { PanelMenu } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { Dispatch, MouseEvent, SetStateAction } from "react";

const AIGroup = ({ setPanel }: { setPanel: Dispatch<SetStateAction<PanelMenu>> }) => {
	const improveClick = () => {
		setPanel(PanelMenu.AiWriting);
	};

	const preventDefault = (e: MouseEvent) => {
		e.preventDefault();
	};

	return (
		<ButtonsLayout>
			<Button
				icon="wand-sparkles"
				tooltipText={t("editor.ai.improve")}
				onMouseDown={preventDefault}
				onClick={improveClick}
			/>
		</ButtonsLayout>
	);
};

export default AIGroup;
