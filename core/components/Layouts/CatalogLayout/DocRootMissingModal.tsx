import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRef, useState } from "react";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import useWatch from "@core-ui/hooks/useWatch";

const DocRootMissingModal = ({ onClose }: { onClose: () => void }) => {
	const [isMainModalOpen, setIsMainModalOpen] = useState(true);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const needSaveDefaultProps = useRef(true);

	const setDefaultProps = async () => {
		await FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify({}));
	};

	const onMainModalClose = () => {
		setIsMainModalOpen(false);
		if (isEditorOpen) return;
		onClose();
		void setDefaultProps();
	};

	useWatch(() => {
		if (isEditorOpen) {
			setIsMainModalOpen(false);
		}
	}, [isEditorOpen]);

	const onEditorClose = () => {
		setIsEditorOpen(false);
		onClose();
		if (!needSaveDefaultProps.current) return;
		void setDefaultProps();
	};

	const startUpdatingProps = () => {
		needSaveDefaultProps.current = false;
	};

	return (
		<>
			<Modal isOpen={isMainModalOpen} onClose={onMainModalClose}>
				<ModalLayoutLight>
					<InfoModalForm
						title={t("catalog.missing-config.title")}
						actionButton={{
							text: t("catalog.missing-config.open-settings"),
							onClick: () => {
								setIsEditorOpen(true);
							},
						}}
						secondButton={{ text: t("cancel"), onClick: () => setIsMainModalOpen(false) }}
					>
						{t("catalog.missing-config.description")}
					</InfoModalForm>
				</ModalLayoutLight>
			</Modal>
			{isEditorOpen && (
				<CatalogPropsEditor
					startUpdatingProps={startUpdatingProps}
					onClose={onEditorClose}
					isOpen={isEditorOpen}
				/>
			)}
		</>
	);
};

export default DocRootMissingModal;
