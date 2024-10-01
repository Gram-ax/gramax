import CommonUnsupportedElementsModal from "@ext/confluence/core/components/CommonUnsupportedElementsModal";
import UnsupportedElements from "@ext/confluence/core/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import Anchor from "@components/controls/Anchor";

interface UnsupportedElementsModalProps {
	startClone: () => void;
	onCancelClick: () => void;
	unsupportedNodes: UnsupportedElements[];
	className?: string;
}

const UnsupportedElementsModal = (props: UnsupportedElementsModalProps) => {
	const { startClone, onCancelClick, unsupportedNodes, className } = props;

	return (
		<CommonUnsupportedElementsModal
			title={t("unsupported-elements-confluence-title")}
			iconColor="var(--color-admonition-note-br-h)"
			description={t("unsupported-elements-confluence1")}
			noteTitle={t("unsupported-elements-confluence2")}
			firstColumnTitle={t("page")}
			unsupportedNodes={unsupportedNodes}
			actionButtonText={t("continue")}
			onActionClick={startClone}
			onCancelClick={onCancelClick}
			className={className}
			renderArticleLink={(article) => <Anchor href={article.link}>{article.title}</Anchor>}
		/>
	);
};

export default UnsupportedElementsModal;
