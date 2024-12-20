import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

const SnippetActions = ({ onClickEdit, onClickDelete }: { onClickEdit: () => void; onClickDelete: () => void }) => {
	return (
		<>
			<ActionButton icon="edit" tooltipText={t("edit2")} onClick={onClickEdit} />
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={onClickDelete} />
		</>
	);
};

export default SnippetActions;
