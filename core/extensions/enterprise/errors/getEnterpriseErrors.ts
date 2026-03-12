import WorkspaceExist from "@ext/enterprise/errors/WorkspaceExist";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import type { ComponentProps, ReactNode } from "react";

export enum EnterpriseErrorCode {
	WorkspaceExist = "WorkspaceExist",
}

const getEnterpriseErrors = (): {
	[key in EnterpriseErrorCode]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	WorkspaceExist: WorkspaceExist,
});

export default getEnterpriseErrors;
