import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface ImageActionsProps {
	isGif?: boolean;
	handleEdit: () => void;
	addSignature: () => void;
}

const ImageActions = (props: ImageActionsProps) => {
	const { isGif, handleEdit, addSignature } = props;

	return (
		<>
			{!isGif && (
				<>
					<ActionButton icon="pencil" onClick={handleEdit} tooltipText={t("edit2")} />
				</>
			)}
			<ActionButton icon="captions" onClick={addSignature} tooltipText={t("signature")} />
		</>
	);
};

export default ImageActions;
