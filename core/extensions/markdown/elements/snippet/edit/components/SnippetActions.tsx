import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface SnippetActionsProps {
	onClickEdit: () => void;
}

const SnippetActions = ({ onClickEdit }: SnippetActionsProps) => {
	return (
		<>
			<ActionButton icon="pencil" onClick={onClickEdit} tooltipText={t("edit2")} />
		</>
	);
};

export default SnippetActions;
