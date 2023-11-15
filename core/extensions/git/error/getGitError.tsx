import { ComponentProps, ReactNode } from "react";
import GetErrorComponent from "../../errorHandlers/logic/GetErrorComponent";
import CheckoutConflictErrorComponent from "../actions/Branch/error/components/CheckoutConflictError";
import MergeErrorConfirm from "../actions/MergeConflictHandler/error/components/MergeErrorConfirm";
import MergeNotSupportedErrorComponent from "../actions/MergeConflictHandler/error/components/MergeNotSupportedError";
import GitErrorCode from "../core/GitRepository/errors/model/GitErrorCode";
import NotFoundErrorHandler from "./NotFoundErrorHandler";

const getGitErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	[GitErrorCode.MergeConflictError]: MergeErrorConfirm,
	[GitErrorCode.NotFoundError]: NotFoundErrorHandler,
	[GitErrorCode.MergeNotSupportedError]: MergeNotSupportedErrorComponent,
	[GitErrorCode.CheckoutConflictError]: CheckoutConflictErrorComponent,
});

export default getGitErrors;
