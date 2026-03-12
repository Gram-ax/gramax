import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import BranchWasDeletedErrorComponent from "@ext/git/core/GitMergeRequest/errors/components/BranchWasDeletedError";
import type { ComponentProps, ReactNode } from "react";
import type { MergeRequestErrorCode } from "./types";

const getMergeRequestErrors = (): {
	[key in MergeRequestErrorCode]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	BranchWasDeleted: BranchWasDeletedErrorComponent,
});

export default getMergeRequestErrors;
