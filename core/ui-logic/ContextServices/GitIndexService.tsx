import type { ClientGitStatus } from "@app/commands/versionControl/statuses";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService, { type OnDidCommandEv } from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import type { UnsubscribeToken } from "@core/Event/EventEmitter";
import type Path from "@core/FileProvider/Path/Path";
import type { TotalOverview } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { createContext, ReactElement, useContext, useState } from "react";

const GitIndexContext = createContext<{ index: Map<string, FileStatus>; overview: TotalOverview }>({
	index: new Map(),
	overview: {
		added: 0,
		deleted: 0,
		modified: 0,
	},
});

export default abstract class GitIndexService {
	private static _apiUrlCreator: ApiUrlCreator;
	private static _unsubscribe: UnsubscribeToken;
	private static _interestedCommands = new Set([
		"article/updateContent",
		"article/create",
		"article/resource/set",
		"article/resource/createFromPath",
		"article/resource/remove",
		"article/property/update",
		"article/property/remove",
		"article/features/setContent",
		"item/remove",
		"item/setPermission",
		"item/updateProps",
		"catalog/language/add",
		"catalog/language/remove",
		"catalog/updateNavigation",
		"catalog/updateProps",
		"elements/icon/create",
		"elements/snippet/create",
		"elements/snippet/edit",
		"elements/snippet/remove",
		"mergeRequests/create",
		"mergeRequests/merge",
		"mergeRequests/setApproval",
		"storage/publish",
		"storage/sync",
		"versionControl/branch/checkout",
		"versionControl/branch/create",
		"versionControl/discard",
		"versionControl/add",
		"init",
		"article/provider/create",
		"article/provider/update",
		"article/provider/remove",
	]);

	private static _inited = false;
	private static _setIndex: (index: Map<string, FileStatus>) => void;
	private static _setOverview: (overview: TotalOverview) => void;

	private static readonly _debounceTime = 600;
	private static _lastRun = 0;
	private static _timeout: NodeJS.Timeout;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const { isNext, isStatic, isStaticCli } = usePlatform();
		const [index, setIndex] = useState<Map<string, FileStatus>>(new Map());
		const [overview, setOverview] = useState<TotalOverview>({
			added: 0,
			deleted: 0,
			modified: 0,
		});

		GitIndexService._apiUrlCreator = ApiUrlCreatorService.value;
		GitIndexService._setIndex = setIndex;
		GitIndexService._setOverview = setOverview;

		const isArticle = PageDataContextService.value.isArticle;

		useWatch(() => {
			if (!isArticle) GitIndexService._inited = false;
		}, [isArticle]);

		if (isArticle && !GitIndexService._inited && !isNext && !isStatic && !isStaticCli) GitIndexService._init();

		return <GitIndexContext.Provider value={{ index, overview }}>{children}</GitIndexContext.Provider>;
	}

	static getStatus() {
		return useContext(GitIndexContext).index;
	}

	static getStatusByPath(path: Path | string) {
		return useContext(GitIndexContext).index.get(typeof path === "string" ? path : path.value);
	}

	static getOverview(): TotalOverview {
		return useContext(GitIndexContext).overview;
	}

	private static _init() {
		if (!GitIndexService._unsubscribe) {
			GitIndexService._unsubscribe = FetchService.events.on(
				"on-did-command",
				GitIndexService._onDidCommand.bind(GitIndexService),
			);
		}

		GitIndexService._inited = true;
		void GitIndexService._onDidCommand({ command: "init", args: {}, result: {} });
	}

	private static _onDidCommand({ command }: OnDidCommandEv) {
		if (!this._interestedCommands.has(command)) return;

		const lastRun = Date.now() - this._lastRun;
		if (this._timeout || lastRun < this._debounceTime) {
			clearTimeout(this._timeout);
			this._timeout = setTimeout(() => void this._update(), this._debounceTime);
			return;
		}

		void this._update();
	}

	private static async _update() {
		const endpoint = this._apiUrlCreator.getVersionControlStatuses();
		const res = await FetchService.fetch<ClientGitStatus[]>(endpoint);
		const data = await res.json();

		const iter: [string, FileStatus][] = data?.map?.((s) => [s.path, s.status]) || [];

		const overview = iter.reduce(
			(acc, [, status]) => {
				if (status === FileStatus.new) acc.added++;
				if (status === FileStatus.delete) acc.deleted++;
				if (status === FileStatus.modified) acc.modified++;
				return acc;
			},
			{ added: 0, deleted: 0, modified: 0 },
		);

		GitIndexService._setIndex?.(new Map(iter));
		GitIndexService._setOverview?.(overview);
		this._lastRun = Date.now();
	}
}
