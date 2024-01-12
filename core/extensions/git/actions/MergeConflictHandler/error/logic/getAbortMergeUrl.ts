import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import Url from "@core-ui/ApiServices/Types/Url";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import { ComponentProps } from "react";

const getAbortMergeUrl = ({
	type,
	error,
	apiUrlCreator,
}: { type: MergeType; apiUrlCreator: ApiUrlCreator } & Pick<
	ComponentProps<typeof GetErrorComponent>,
	"error"
>): Url => {
	const theirsBranch: string = error.props.theirs;
	const stashHash: string = error.props.theirs;

	if (type === MergeType.Branches) return apiUrlCreator.abortMergeBranch(theirsBranch);
	if (type === MergeType.Sync) return apiUrlCreator.abortMergeSync(stashHash);
};
export default getAbortMergeUrl;
