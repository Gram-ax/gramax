import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";

interface InlineImageActionsProps {
	toBlock: () => void;
}

const InlineImageActions = ({ toBlock }: InlineImageActionsProps) => {
	return <ActionButton icon="gallery-vertical" onClick={toBlock} tooltipText={t("inline-to-block-image")} />;
};

export default InlineImageActions;
