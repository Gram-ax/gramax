import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface SnippetActionsProps {
	existsSnippet: boolean;
	onClickEdit: () => void;
	onClickDelete: () => void;
}

const SnippetActions = ({ existsSnippet, onClickEdit, onClickDelete }: SnippetActionsProps) => {
	return (
		<>
			{existsSnippet && <ActionButton icon="edit" tooltipText={t("edit2")} onClick={onClickEdit} />}
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={onClickDelete} />
		</>
	);
};

export default SnippetActions;
