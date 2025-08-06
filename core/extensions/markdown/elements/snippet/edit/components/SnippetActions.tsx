import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface SnippetActionsProps {
	onClickEdit: () => void;
}

const SnippetActions = ({ onClickEdit }: SnippetActionsProps) => {
	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit2")} onClick={onClickEdit} />
		</>
	);
};

export default SnippetActions;
