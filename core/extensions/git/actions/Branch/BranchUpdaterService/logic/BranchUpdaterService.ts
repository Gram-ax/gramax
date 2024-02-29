import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";
import BranchData from "../../../../../VersionControl/model/branch/BranchData";

type OnBranchUpdateListener = (branch: string, caller: OnBranchUpdateCaller) => void | Promise<void>;

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
		const branchName = await BranchUpdaterService._getBranch(apiUrlCreator);
		if (!branchName) return;
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this._listeners.forEach((l) => l(branchName, caller));
	}

	private static async _getBranch(apiUrlCreator: ApiUrlCreator): Promise<string> {
		const res = await FetchService.fetch<BranchData>(apiUrlCreator.getVersionControlCurrentBranchUrl());
		if (!res.ok) return;
		return (await res.json())?.name;
	}
}
