import ModalLayout from "@components/Layouts/Modal";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useState } from "react";

interface SignOutEnterpriseProps {
	workspaceConfig: ClientWorkspaceConfig;
	onClose: () => void;
}

const SignOutEnterprise = ({ workspaceConfig, onClose }: SignOutEnterpriseProps) => {
	const [isOpen, setIsOpen] = useState(true);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const removeWorkspace = async () => {
		ModalToOpenService.setValue(ModalToOpen.Loading);
		await FetchService.fetch(apiUrlCreator.getLogoutEnterpriseUrl(workspaceConfig.path));
		ModalToOpenService.resetValue();
		await refreshPage();
		SourceDataService.refresh();
	};

	return (
		<ModalLayout
			contentWidth="S"
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
				onClose();
			}}
		>
			<InfoModalForm
				title={t("enterprise.workspace-exit")}
				icon={{ code: "circle-alert", color: "var(--color-warning)" }}
				closeButton={{ text: t("cancel") }}
				onCancelClick={() => {
					setIsOpen(false);
					onClose();
					refreshPage();
				}}
				actionButton={{
					onClick: () => removeWorkspace(),
					text: t("exit"),
				}}
			>
				<div>{t("enterprise.workspace-exit-warning")}</div>
			</InfoModalForm>
		</ModalLayout>
	);
};

export default SignOutEnterprise;
