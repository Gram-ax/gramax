import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const PullHandler = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);

	const onClose = () => {
		setIsOpen(false);
		ModalToOpenService.resetValue();
	};

	const onSyncClick = async () => {
		setIsOpen(false);
		await SyncService.sync(apiUrlCreator);
	};

	return (
		<ModalLayout isOpen={isOpen} onClose={onClose} onCmdEnter={onSyncClick} onOpen={() => setIsOpen(true)}>
			<ModalLayoutLight>
				<InfoModalForm
					actionButton={{
						text: t("sync"),
						onClick: onSyncClick,
					}}
					isWarning={true}
					onCancelClick={() => setIsOpen(false)}
					title={t("sync-catalog")}
				>
					<span>{t("sync-catalog-desc")}</span>
				</InfoModalForm>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PullHandler;
