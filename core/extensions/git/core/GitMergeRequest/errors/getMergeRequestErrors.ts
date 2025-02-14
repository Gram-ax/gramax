import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import BranchWasDeletedErrorComponent from "@ext/git/core/GitMergeRequest/errors/components/BranchWasDeletedError";
import { ComponentProps, ReactNode } from "react";

export enum MergeRequestErrorCode {
	BranchWasDeleted = "BranchWasDeleted",
}

const getMergeRequestErrors = (): {
	[key in MergeRequestErrorCode]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	BranchWasDeleted: BranchWasDeletedErrorComponent,
});

export default getMergeRequestErrors;
