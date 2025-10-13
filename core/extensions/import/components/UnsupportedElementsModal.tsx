import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import Anchor from "@components/controls/Anchor";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import sourceTypeConfig from "@ext/import/logic/unsupportedModalConfig";
import { useState } from "react";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import { Button } from "@ui-kit/Button";

interface UnsupportedElementsModalProps {
	startClone: () => void;
	onCancelClick: () => void;
	unsupportedNodes: UnsupportedElements[];
	sourceType: SourceType;
	className?: string;
}

const UnsupportedElementsModal = (props: UnsupportedElementsModalProps) => {
	const { startClone, onCancelClick, unsupportedNodes, sourceType } = props;
	const [isOpen, setIsOpen] = useState(true);

	const { titleKey, descriptionKey } = sourceTypeConfig[sourceType] || sourceTypeConfig.default;

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			onCancelClick();
		}
	};

	return (
		<CommonUnsupportedElementsModal
			open={isOpen}
			onOpenChange={handleOpenChange}
			unsupportedElements={unsupportedNodes}
			onContinue={startClone}
			title={t(titleKey)}
			description={t(descriptionKey)}
			firstColumnTitle={t("page")}
			renderArticleLink={(article) => (
				<Anchor href={article.link}>
					<Button variant="link" status="info" className="p-0" style={{ height: "auto", textAlign: "left" }}>
						{article.title}
					</Button>
				</Anchor>
			)}
		/>
	);
};

export default UnsupportedElementsModal;
