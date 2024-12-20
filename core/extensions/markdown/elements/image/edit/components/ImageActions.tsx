import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface ImageActionsProps {
	isGif?: boolean;
	handleEdit: () => void;
	handleDelete: () => void;
	addSignature: () => void;
}

const ImageActions = ({ isGif, handleEdit, handleDelete, addSignature }: ImageActionsProps) => {
	return (
		<>
			{!isGif && <ActionButton icon="pencil" onClick={handleEdit} tooltipText={t("edit2")} />}
			<ActionButton icon="a-large-small" onClick={addSignature} tooltipText={t("signature")} />
			<ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />
		</>
	);
};

export default ImageActions;
