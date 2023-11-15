import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../ui-logic/ApiServices/FetchService";
import BranchData from "../../../../VersionControl/model/branch/BranchData";

let _onUpdateBranch: (branch: string) => void;

export default class BranchUpdaterService {
	public static bindOnUpdateBranch(onUpdateBranch: typeof _onUpdateBranch) {
		_onUpdateBranch = onUpdateBranch;
	}

	public static async updateBranch(apiUrlCreator: ApiUrlCreator) {
		const data = await BranchUpdaterService._getBranch(apiUrlCreator);
		if (!data) return;
		if (_onUpdateBranch) _onUpdateBranch(data);
	}

	private static async _getBranch(apiUrlCreator: ApiUrlCreator): Promise<string> {
		const res = await FetchService.fetch<BranchData>(apiUrlCreator.getVersionControlCurrentBranchUrl());
		if (!res.ok) return;
		return (await res.json()).name;
	}
}
