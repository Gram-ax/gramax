import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";

import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import tryOpenMergeConflict from "@ext/git/actions/MergeConflictHandler/logic/tryOpenMergeConflict";
import t from "@ext/localization/locale/translate";

type CheckConflictProps = {
	apiUrlCreator: ApiUrlCreator;
	isNext: boolean;
	isReadOnly: boolean;
};

const checkConflict = async ({ apiUrlCreator, isNext, isReadOnly }: CheckConflictProps) => {
	if (isNext || isReadOnly) return;

	const res = await FetchService.fetch<MergeData>(apiUrlCreator.getMergeData());
	if (!res.ok) return;
	tryOpenMergeConflict({
		mergeData: await res.json(),
		errorText: t("git.merge.confirm.catalog-conflict-state"),
		title: t("git.merge.error.catalog-conflict-state"),
	});
};

export default checkConflict;
