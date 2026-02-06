import Anchor from "@components/controls/Anchor";
import CommonUnsupportedElementsModal from "@ext/import/components/CommonUnsupportedElementsModal";
import sourceTypeConfig from "@ext/import/logic/unsupportedModalConfig";
import { UnsupportedElements } from "@ext/import/model/UnsupportedElements";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { Button } from "@ui-kit/Button";
import { useState } from "react";

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
			description={t(descriptionKey)}
			firstColumnTitle={t("page")}
			onContinue={startClone}
			onOpenChange={handleOpenChange}
			open={isOpen}
			renderArticleLink={(article) => (
				<Anchor href={article.link}>
					<Button className="p-0" status="info" style={{ height: "auto", textAlign: "left" }} variant="link">
						{article.title}
					</Button>
				</Anchor>
			)}
			title={t(titleKey)}
			unsupportedElements={unsupportedNodes}
		/>
	);
};

export default UnsupportedElementsModal;
