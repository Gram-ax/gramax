import CloneErrorComponent from "@ext/git/actions/Clone/error/components/CloneError";
import { RepositoryHealthcheckError } from "@ext/git/actions/RepositoryBroken/RepositoryHealthcheckFailed";
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
	[GitErrorCode.RemoteRepositoryNotFoundError]: CloneErrorComponent,
	[GitErrorCode.HealthcheckFailed]: RepositoryHealthcheckError,
});

export default getGitErrors;
