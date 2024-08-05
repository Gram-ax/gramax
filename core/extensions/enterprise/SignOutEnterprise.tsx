import ModalLayout from "@components/Layouts/Modal";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useState } from "react";

const SignOutEnterprise = ({
	trigger,
	workspaceConfig,
}: {
	trigger: JSX.Element;
	workspaceConfig: ClientWorkspaceConfig;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const removeWorkspace = async () => {
		await FetchService.fetch(apiUrlCreator.removeWorkspace(workspaceConfig.path));
		await refreshPage();
	};

	return (
		<ModalLayout
			trigger={trigger}
			contentWidth="S"
			isOpen={isOpen}
			closeOnCmdEnter={false}
			onOpen={() => {
				setIsOpen(true);
			}}
			onClose={() => {
				setIsOpen(false);
			}}
		>
			<InfoModalForm
				title={t("enterprise.workspace-exit")}
				icon={{ code: "circle-alert", color: "var(--color-warning)" }}
				closeButton={{ text: t("cancel") }}
				onCancelClick={() => refreshPage()}
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
