import type { ComponentProps } from "react";
import DefaultErrorComponent from "../../errorHandlers/client/components/DefaultError";
import type GetErrorComponent from "../../errorHandlers/logic/GetErrorComponent";
import NotFoundedBranchError from "../actions/Clone/error/components/NotFoundedBranchError";
import type GitError from "../core/GitCommands/errors/GitError";

const NotFoundErrorHandler = ({ appVersionLabel, error, onCancelClick }: ComponentProps<typeof GetErrorComponent>) => {
	const e = error as GitError;
	const caller = e.props.caller;
	if (caller === "clone") {
		const notFoundedBranch = e.props.errorData?.what;
		return notFoundedBranch ? (
			<NotFoundedBranchError notFoundedBranch={notFoundedBranch} onCancelClick={onCancelClick} />
		) : (
			<DefaultErrorComponent appVersionLabel={appVersionLabel} error={error} onCancelClick={onCancelClick} />
		);
	}

	return <DefaultErrorComponent appVersionLabel={appVersionLabel} error={error} onCancelClick={onCancelClick} />;
};

export default NotFoundErrorHandler;
