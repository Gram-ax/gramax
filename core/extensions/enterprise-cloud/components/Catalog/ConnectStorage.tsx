import StatusBarElement from "@components/Layouts/StatusBar/StatusBarElement";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import t from "@ext/localization/locale/translate";

export const GesCloudConnectStorage = () => {
	return (
		<StatusBarElement
			iconCode="cloud-upload"
			iconStyle={{ fontSize: "15px" }}
			onClick={() => {
				const modalId = ModalToOpenService.addModal(ModalToOpen.GesCloudInitCatalog, {
					onClose: () => ModalToOpenService.removeModal(modalId),
				});
			}}
			tooltipText={t("publish-catalog")}
		/>
	);
};
