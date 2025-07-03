import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface ImageActionsProps {
	isGif?: boolean;
	handleEdit: () => void;
	handleDelete: () => void;
	addSignature: () => void;
	toInline: () => void;
}

const ImageActions = ({ isGif, handleEdit, handleDelete, addSignature, toInline }: ImageActionsProps) => {
	return (
		<>
			{!isGif && (
				<>
					<ActionButton icon="pencil" onClick={handleEdit} tooltipText={t("edit2")} />
					<ActionButton
						icon="gallery-horizontal"
						onClick={toInline}
						tooltipText={t("block-to-inline-image")}
					/>
				</>
			)}
			<ActionButton icon="captions" onClick={addSignature} tooltipText={t("signature")} />
			<ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />
		</>
	);
};

export default ImageActions;
