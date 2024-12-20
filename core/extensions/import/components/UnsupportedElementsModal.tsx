import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import UnsupportedElements from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import Anchor from "@components/controls/Anchor";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import sourceTypeConfig from "@ext/import/logic/unsupportedModalConfig";

interface UnsupportedElementsModalProps {
	startClone: () => void;
	onCancelClick: () => void;
	unsupportedNodes: UnsupportedElements[];
	sourceType: SourceType;
	className?: string;
}

const UnsupportedElementsModal = (props: UnsupportedElementsModalProps) => {
	const { startClone, onCancelClick, unsupportedNodes, sourceType, className } = props;

	const { titleKey, descriptionKey, noteTitleKey } = sourceTypeConfig[sourceType] || sourceTypeConfig.default;

	return (
		<CommonUnsupportedElementsModal
			title={t(titleKey)}
			iconColor="var(--color-admonition-note-br-h)"
			description={t(descriptionKey)}
			noteTitle={t(noteTitleKey)}
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
