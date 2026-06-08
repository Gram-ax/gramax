import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Workspace from "@core-ui/ContextServices/Workspace";
import { ErrorBody } from "@ext/errorHandlers/client/components/DefaultError";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import t from "@ext/localization/locale/translate";
import { DialogBody, DialogFooterTemplate } from "@ui-kit/Dialog";
import type { ComponentProps } from "react";

const WorkspaceExist = ({ onCancelClick, error }: ComponentProps<typeof GetErrorComponent>) => {
	const workspacePath = error.props?.workspacePath;
	const apiUrlCreator = ApiUrlCreatorService.value;

	return (
		<>
			<DialogErrorHeader error={error} />
			<DialogBody>
				<ErrorBody error={error} />
			</DialogBody>
			<DialogFooterTemplate
				primaryButton={t("switch")}
				primaryButtonProps={{
					onClick: () => {
						Workspace.setActive(workspacePath, apiUrlCreator);
						onCancelClick();
					},
				}}
			/>
		</>
	);
};

export default WorkspaceExist;
