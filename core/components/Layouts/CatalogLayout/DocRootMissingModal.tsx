import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import useWatch from "@core-ui/hooks/useWatch";
import CatalogPropsEditor from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditor";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useIsRepoOk } from "@ext/storage/logic/utils/useStorage";
import { ComponentProps, useRef, useState } from "react";
import ApiUrlCreatorService from "../../../ui-logic/ContextServices/ApiUrlCreator";

const DocRootMissingModal = ({ onClose }: { onClose: () => void }) => {
	const [isMainModalOpen, setIsMainModalOpen] = useState(true);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const needSaveDefaultProps = useRef(true);

	const isRepoOk = useIsRepoOk(null, false);

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

	if (!isRepoOk) return null;

	return (
		<>
			<Modal isOpen={isMainModalOpen} onClose={onMainModalClose}>
				<ModalLayoutLight>
					<InfoModalForm
						actionButton={{
							text: t("catalog.missing-config.open-settings"),
							onClick: () => {
								ModalToOpenService.setValue<ComponentProps<typeof CatalogPropsEditor>>(
									ModalToOpen.CatalogPropsEditor,
									{
										onClose: () => {
											onEditorClose();
											ModalToOpenService.resetValue();
										},
										onSubmit: () => {
											startUpdatingProps();
										},
									},
								);
							},
						}}
						secondButton={{ text: t("cancel"), onClick: () => setIsMainModalOpen(false) }}
						title={t("catalog.missing-config.title")}
					>
						{t("catalog.missing-config.description")}
					</InfoModalForm>
				</ModalLayoutLight>
			</Modal>
		</>
	);
};

export default DocRootMissingModal;
