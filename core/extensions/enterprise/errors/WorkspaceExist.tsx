import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { ErrorBody, getIcon } from "@ext/errorHandlers/client/components/DefaultError";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { ComponentProps } from "react";

const WorkspaceExist = ({ onCancelClick, error }: ComponentProps<typeof GetErrorComponent>) => {
	const workspacePath = error.props?.workspacePath;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<InfoModalForm
			title={error.title}
			icon={getIcon(error)}
			isWarning={error.isWarning}
			actionButton={{
				text: t("switch"),
				onClick: () => {
					WorkspaceService.setActive(workspacePath, apiUrlCreator);
					onCancelClick();
				},
			}}
		>
			<ErrorBody error={error} />
		</InfoModalForm>
	);
};

export default WorkspaceExist;
