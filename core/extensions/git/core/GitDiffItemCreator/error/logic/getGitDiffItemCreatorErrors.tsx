import { ComponentProps, ReactNode } from "react";
import GetErrorComponent from "../../../../../errorHandlers/logic/GetErrorComponent";
import NoChangesErrorComponent from "../components/NoChangesError";

const getGitDiffItemCreatorErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	noChanges: NoChangesErrorComponent,
});

export default getGitDiffItemCreatorErrors;
