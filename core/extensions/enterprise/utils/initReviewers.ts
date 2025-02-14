import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";

const initReviewers = async (
	gesUrl: string,
	source: SourceData,
	storage: Storage,
	approvers: ApprovalSignature[],
	branch: string,
) => {
	if (!isGitSourceType(source.sourceType) || !isGitSourceType(await storage.getType())) return;

	const gitSource = source as GitSourceData;
	if (!gesUrl || !gesUrl.includes(gitSource.domain)) return;

	const api = new EnterpriseApi(gesUrl);
	const gitStorage = storage as GitStorage;
	const resourceId = `${await gitStorage.getGroup()}/${await gitStorage.getName()}`;
	const res = await api.addReviews(
		gitSource.token,
		resourceId,
		approvers.map((a) => a.email),
		branch,
	);
	if (!res) {
		throw new DefaultError(
			t("enterprise.add-reviews.failed-to-add-message"),
			null,
			null,
			false,
			t("enterprise.add-reviews.failed-to-add-title"),
		);
	}
};

export default initReviewers;
