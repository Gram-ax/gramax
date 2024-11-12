import { CloneListItem } from "@ext/git/actions/Source/components/CloneFields";
import GitRepsModelState from "@ext/git/actions/Source/Git/model/GitRepsModelState";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";

interface CallbackData {
	fromPage: number;
	toPage: number;
	totalPages?: number;
	totalReps?: number;
}

type CallbackType = (model: CloneListItem[], state: GitRepsModelState, data: CallbackData) => void;

export default class GitPaginatedProjectList {
	private _model: CloneListItem[] = [];
	private _state: GitRepsModelState = "notLoaded";
	private _callback: CallbackType;

	constructor(private _api: GitSourceApi, private _filter?: (modelItem: CloneListItem) => boolean) {}

	async startLoading(): Promise<void> {
		this._state = "loading";
		this._triggerOnChange({ fromPage: 0, toPage: 0 });

		const PER_PAGE = this._api.defaultPerPage;

		const firstPageData = (await this._api.getPageProjects(1, 1))[0];
		const totalPages = firstPageData.totalPages ?? 1;
		const totalReps = firstPageData.totalPathsCount ?? totalPages * PER_PAGE;
		for (let i = 0; i < totalReps; i++) {
			const repData = firstPageData.repDatas[i];
			this._model.push(repData ? { path: repData.path, date: repData.lastActivity } : null);
		}
		if (totalPages < 2) return this._stop({ fromPage: 1, toPage: 1, totalPages: 1, totalReps: totalReps });

		this._triggerOnChange({ fromPage: 1, toPage: 1, totalPages, totalReps });
		const otherPages = await this._api.getPageProjects(2, totalPages);
		const repDatas = otherPages.map((p) => p.repDatas).flat();

		for (let i = 0; i < totalReps - PER_PAGE; i++) {
			const repData = repDatas[i];
			this._model[i + PER_PAGE] = repData ? { path: repData.path, date: repData.lastActivity } : null;
		}

		this._stop({ fromPage: 2, toPage: totalPages, totalPages, totalReps });
	}

	onPagesFetched(callback: CallbackType) {
		this._callback = callback;
	}

	private _stop(data: CallbackData) {
		this._model = this._model.filter((x) => x);
		this._state = "done";
		this._triggerOnChange(data);
	}

	private _triggerOnChange(data: CallbackData) {
		const filteredModel = this._filter
			? this._model.filter((x) => x && this._filter(x))
			: this._model.filter(Boolean);

		this._callback(filteredModel, this._state, data);
	}
}
