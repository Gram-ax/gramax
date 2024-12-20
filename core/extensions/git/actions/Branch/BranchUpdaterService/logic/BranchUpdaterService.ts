import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";

type OnBranchUpdateListener = (branch: GitBranchData, caller: OnBranchUpdateCaller) => void | Promise<void>;

export default class BranchUpdaterService {
	private static _listeners = new Set<OnBranchUpdateListener>();

	public static addListener(onUpdateBranch: OnBranchUpdateListener) {
		this._listeners.add(onUpdateBranch);
	}

	public static removeListener(onUpdateBranch: OnBranchUpdateListener) {
		this._listeners.delete(onUpdateBranch);
	}

	public static async updateBranch(
		apiUrlCreator: ApiUrlCreator,
		caller: OnBranchUpdateCaller = OnBranchUpdateCaller.Checkout,
	) {
		const branch = await BranchUpdaterService._getBranch(apiUrlCreator);
		if (!branch) return;
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this._listeners.forEach((l) => l(branch, caller));
	}

	private static async _getBranch(apiUrlCreator: ApiUrlCreator): Promise<GitBranchData> {
		const res = await FetchService.fetch<GitBranchData>(
			apiUrlCreator.getVersionControlCurrentBranchUrl({ onlyName: false, cachedMergeRequests: false }),
		);
		if (!res.ok) return;
		return await res.json();
	}
}
