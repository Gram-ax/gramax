import CloneErrorComponent from "@ext/git/actions/Clone/error/components/CloneError";
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
	[GitErrorCode.CloneError]: CloneErrorComponent,
});

export default getGitErrors;
