import { useEffect } from "react";
import PageDataContext from "../../../../../logic/Context/PageDataContext";
import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import SourceType from "../../../../storage/logic/SourceDataProvider/model/SourceType";
import getSourceNameByData from "../../../../storage/logic/utils/getSourceNameByData";
import GitSourceData from "../../../core/model/GitSourceData.schema";
import GitHubSourceData from "../GitHub/logic/GitHubSourceData";
import checkGitHubSource from "../GitHub/logic/checkGitHubSource";
import checkGitLabSource from "../GitLab/logic/checkGitLabSource";

const removeExpiredSources = async (apiUrlCreator: ApiUrlCreator, pageProperties: PageDataContext) => {
	for (const source of pageProperties.sourceDatas) {
		let removedSourceName: string = null;
		if (source.sourceType == SourceType.gitLab) {
			removedSourceName = await checkGitLabSource(source as GitSourceData);
		}
		if (source.sourceType == SourceType.gitHub) {
			removedSourceName = await checkGitHubSource(source as GitHubSourceData, apiUrlCreator);
		}
		if (removedSourceName) {
			pageProperties.sourceDatas = pageProperties.sourceDatas.filter(
				(s) => getSourceNameByData(s) !== removedSourceName,
			);
			PageDataContextService.value = { ...pageProperties };
			FetchService.fetch(apiUrlCreator.removeSourceData(removedSourceName));
		}
	}
};

const useRemoveExpiredSources = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageProperties = PageDataContextService.value;

	useEffect(() => {
		removeExpiredSources(apiUrlCreator, pageProperties);
	}, []);
};

export default useRemoveExpiredSources;
