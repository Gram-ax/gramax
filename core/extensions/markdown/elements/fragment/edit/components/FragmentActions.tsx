import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface FragmentActionsProps {
	onClickEdit: () => void;
}

const FragmentActions = ({ onClickEdit }: FragmentActionsProps) => {
	return (
		<>
			<ActionButton icon="pencil" onClick={onClickEdit} tooltipText={t("edit2")} />
		</>
	);
};

export default FragmentActions;
