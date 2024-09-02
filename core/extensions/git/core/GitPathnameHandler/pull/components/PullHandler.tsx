import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const PullHandler = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);

	const onSyncClick = async () => {
		setIsOpen(false);
		await SyncService.sync(apiUrlCreator);
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
			}}
			onCmdEnter={onSyncClick}
		>
			<ModalLayoutLight>
				<InfoModalForm
					onCancelClick={() => setIsOpen(false)}
					title={t("sync-catalog")}
					actionButton={{
						text: t("sync"),
						onClick: onSyncClick,
					}}
					isWarning={true}
				>
					<span>{t("sync-catalog-desc")}</span>
				</InfoModalForm>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default PullHandler;
