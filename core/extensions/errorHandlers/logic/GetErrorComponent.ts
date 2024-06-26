import getStorageErrors from "@ext/storage/components/getStorageErrors";
import { ComponentProps, ReactNode } from "react";
import getFileProviderErrors from "../../../logic/FileProvider/error/logic/getFileProviderErrors";
import getGitDiffItemCreatorErrors from "../../git/core/GitDiffItemCreator/error/logic/getGitDiffItemCreatorErrors";
import getGitErrors from "../../git/error/getGitError";
import DefaultErrorComponent from "../client/components/DefaultError";
import DefaultError from "./DefaultError";
import getCommandsErrors from "@components/Commands/getCommandsErrors";

const getComponents = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	...getGitDiffItemCreatorErrors(),
	...getFileProviderErrors(),
	...getGitErrors(),
	...getStorageErrors(),
	...getCommandsErrors(),
});

const GetErrorComponent = (args: { error: DefaultError; onCancelClick: () => void }): ReactNode => {
	if (!args.error) return;
	const Component = getComponents()[args.error.props?.errorCode] ?? DefaultErrorComponent;
	return Component(args);
};

export default GetErrorComponent;
