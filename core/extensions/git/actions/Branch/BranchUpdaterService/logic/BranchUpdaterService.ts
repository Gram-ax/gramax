import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FetchService from "../../../../../../ui-logic/ApiServices/FetchService";

export type OnBranchUpdateListener = (branch: GitBranchData, caller: OnBranchUpdateCaller) => void | Promise<void>;
export type OnBranchUpdateErrorListener = (error: any) => void | Promise<void>;

export default class BranchUpdaterService {
	private static _branch: GitBranchData = null;
	private static _listeners = new Set<OnBranchUpdateListener>();
	private static _onErrorListeners = new Set<OnBranchUpdateErrorListener>();

	public static get branch() {
		return this._branch;
	}

	public static addListener(onUpdateBranch: OnBranchUpdateListener) {
		this._listeners.add(onUpdateBranch);
	}

	public static removeListener(onUpdateBranch: OnBranchUpdateListener) {
		this._listeners.delete(onUpdateBranch);
	}

	public static addOnErrorListener(onError: OnBranchUpdateErrorListener) {
		this._onErrorListeners.add(onError);
	}

	public static removeOnErrorListener(onError: OnBranchUpdateErrorListener) {
		this._onErrorListeners.delete(onError);
	}

	public static async updateBranch(
		apiUrlCreator: ApiUrlCreator,
		caller: OnBranchUpdateCaller = OnBranchUpdateCaller.Checkout,
	) {
		const branch = await BranchUpdaterService._getBranch(apiUrlCreator);
		if (!branch) return;
		await Promise.all(Array.from(this._listeners).map((l) => l(branch, caller)));
	}

	private static async _getBranch(apiUrlCreator: ApiUrlCreator): Promise<GitBranchData> {
		const res = await FetchService.fetch<GitBranchData>(
			apiUrlCreator.getCurrentBranch({ onlyName: false, cachedMergeRequests: false }),
		);
		if (!res.ok) {
			const error = (await res.json()) as any;
			await Promise.all(Array.from(this._onErrorListeners).map((l) => l(error)));
			return;
		}
		this._branch = await res.json();
		return this._branch;
	}
}
