import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import Url from "@core-ui/ApiServices/Types/Url";
import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import MergeType from "@ext/git/actions/MergeConflictHandler/model/MergeType";
import { ComponentProps } from "react";

const getResolveMergeConflictFilesUrl = ({
	type,
	error,
	apiUrlCreator,
}: { type: MergeType; apiUrlCreator: ApiUrlCreator } & Pick<
	ComponentProps<typeof GetErrorComponent>,
	"error"
>): Url => {
	const theirsBranch: string = error.props.theirs;
	const stashHash: string = error.props.theirs;
	const { branchNameBefore, deleteAfterMerge, headBeforeMerge } = error.props as {
		branchNameBefore: string;
		headBeforeMerge: string;
		deleteAfterMerge: boolean;
	} & typeof error.props;

	if (type === MergeType.Branches)
		return apiUrlCreator.resolveMergeBranchConflictedFiles(
			theirsBranch,
			branchNameBefore,
			headBeforeMerge,
			deleteAfterMerge,
		);
	if (type === MergeType.Sync) return apiUrlCreator.resolveMergeSyncConflictedFiles(stashHash);
};

export default getResolveMergeConflictFilesUrl;
