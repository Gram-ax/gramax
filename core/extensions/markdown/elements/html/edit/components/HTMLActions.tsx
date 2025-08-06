import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface HTMLActionsProps {
	openEditor: () => void;
}

const HTMLActions = ({ openEditor }: HTMLActionsProps) => {
	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit")} onClick={openEditor} />
		</>
	);
};

export default HTMLActions;
