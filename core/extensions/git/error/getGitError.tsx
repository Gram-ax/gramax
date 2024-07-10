import CloneError404Component from "@ext/git/actions/Clone/error/components/CloneError404";
import { ComponentProps, ReactNode } from "react";
import GetErrorComponent from "../../errorHandlers/logic/GetErrorComponent";
import CheckoutConflictErrorComponent from "../actions/Branch/error/components/CheckoutConflictError";
import GitErrorCode from "../core/GitCommands/errors/model/GitErrorCode";
import NotFoundErrorHandler from "./NotFoundErrorHandler";

const getGitErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	[GitErrorCode.NotFoundError]: NotFoundErrorHandler,
	[GitErrorCode.CheckoutConflictError]: CheckoutConflictErrorComponent,
	[GitErrorCode.CloneError404]: CloneError404Component,
});

export default getGitErrors;
