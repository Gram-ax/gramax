import getEnterpriseErrors from "@ext/enterprise/errors/getEnterpriseErrors";
import NetworkApiErrorComponent from "@ext/errorHandlers/network/components/NetworkApiError";
import { NetworkApiErrorCode } from "@ext/errorHandlers/network/NetworkApiError";
import getMergeRequestErrors from "@ext/git/core/GitMergeRequest/errors/getMergeRequestErrors";
import getStorageErrors from "@ext/storage/components/getStorageErrors";
import { DialogContent } from "@ui-kit/Dialog";
import type { ReactNode } from "react";
import getFileStructueErrors from "../../../logic/FileStructue/error/logic/getFileStructueErrors";
import getGitErrors from "../../git/error/getGitError";
import DefaultErrorComponent from "../client/components/DefaultError";
import type DefaultError from "./DefaultError";

export interface GetErrorComponentProps {
	error: DefaultError;
	onCancelClick: () => void;
	appVersionLabel?: string;
}

const getComponents = (): {
	[key: string]: (args: GetErrorComponentProps) => ReactNode;
} => ({
	...getFileStructueErrors(),
	...getGitErrors(),
	...getStorageErrors(),
	...getMergeRequestErrors(),
	...getEnterpriseErrors(),
	[NetworkApiErrorCode]: NetworkApiErrorComponent,
});

const GetErrorComponent = (args: GetErrorComponentProps): ReactNode => {
	if (!args.error) return;
	const Component = getComponents()[args.error.props?.errorCode] ?? DefaultErrorComponent;
	return <DialogContent>{Component(args)}</DialogContent>;
};

export default GetErrorComponent;
