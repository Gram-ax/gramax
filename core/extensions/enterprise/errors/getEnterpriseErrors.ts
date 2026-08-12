import LogoutFailed from "@ext/enterprise/errors/LogoutFailed";
import WorkspaceExist from "@ext/enterprise/errors/WorkspaceExist";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import type { ComponentProps, ReactNode } from "react";

export enum EnterpriseErrorCode {
	WorkspaceExist = "WorkspaceExist",
	LogoutFailed = "LogoutFailed",
}

const getEnterpriseErrors = (): {
	[key in EnterpriseErrorCode]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	WorkspaceExist: WorkspaceExist,
	LogoutFailed: LogoutFailed,
});

export default getEnterpriseErrors;
