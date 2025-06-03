import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface SnippetActionsProps {
	onClickDelete: () => void;
	onClickEdit: () => void;
}

const SnippetActions = ({ onClickDelete, onClickEdit }: SnippetActionsProps) => {
	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit2")} onClick={onClickEdit} />
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={onClickDelete} />
		</>
	);
};

export default SnippetActions;
