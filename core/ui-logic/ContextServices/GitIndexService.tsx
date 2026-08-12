/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
/** biome-ignore-all lint/correctness/useHookAtTopLevel: expected */
import type { ClientGitStatus } from "@app/commands/versionControl/statuses";
import { createEventEmitter, type UnsubscribeToken } from "@core/Event/EventEmitter";
import type Path from "@core/FileProvider/Path/Path";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService, { type OnDidCommandEv } from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useApiEvent } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useIsRevision } from "@ext/git/actions/Revisions/logic/hooks/useIsRevision";
import type { TotalOverview } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { createContext, type ReactElement, useCallback, useContext, useLayoutEffect, useState } from "react";

const GitIndexContext = createContext<{ index: Map<string, FileStatus>; overview: TotalOverview }>({
	index: new Map(),
	overview: {
		added: 0,
		deleted: 0,
		modified: 0,
	},
});

type GitIndexEvents = {
	"index-changed": (payload: { catalogName: string; changed: number }) => void;
};

export default abstract class GitIndexService {
	static readonly events = createEventEmitter<GitIndexEvents>();

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
		"catalog/views/create",
		"catalog/views/delete",
		"elements/icon/create",
		"elements/fragment/create",
		"elements/fragment/edit",
		"elements/fragment/remove",
		"mergeRequests/create",
		"mergeRequests/deleteMr",
		"mergeRequests/merge",
		"mergeRequests/setApproval",
		"storage/publish",
		"storage/sync",
		"versionControl/mergeConflict/resolve",
		"versionControl/branch/checkout",
		"versionControl/branch/create",
		"versionControl/discard",
		"versionControl/add",
		"init",
		"article/provider/create",
		"article/provider/update",
		"article/provider/remove",
		"comments/copy",
		"comments/update",
		"comments/delete",
		"catalog/move",
		"article/move",
		"agent/message/send",
		"fs/handleEvents",
	]);

	private static _enabled = false;
	private static _catalogName: string | undefined;
	private static _setIndex: (index: Map<string, FileStatus>) => void;
	private static _setOverview: (overview: TotalOverview) => void;

	private static readonly _debounceTime = 600;
	private static _lastRun = 0;
	private static _timeout: NodeJS.Timeout;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const { isNext, isStatic, isStaticCli } = usePlatform();
		const isRevision = useIsRevision();
		const catalogName = useCatalogPropsStore((state) => state.data?.name);
		const { isReadOnly } = PageDataContextService.value.conf;

		const [index, setIndex] = useState<Map<string, FileStatus>>(new Map());
		const [overview, setOverview] = useState<TotalOverview>({
			added: 0,
			deleted: 0,
			modified: 0,
		});

		GitIndexService._apiUrlCreator = ApiUrlCreatorService.value;
		GitIndexService._catalogName = useCatalogPropsStore((s) => s.data?.name);
		GitIndexService._setIndex = setIndex;
		GitIndexService._setOverview = setOverview;

		GitIndexService._enabled = PageDataContextService.value.isArticle;

		if (!isNext && !isStatic && !isStaticCli) {
			const callback = useCallback(
				(ev: OnDidCommandEv) => {
					if (isReadOnly && !isRevision) return;
					GitIndexService._onDidCommand(ev);
				},
				[isReadOnly],
			);
			useApiEvent("on-did-command", callback);

			useLayoutEffect(() => {
				if (isReadOnly && !isRevision) return;
				void GitIndexService._onDidCommand({ command: "init", args: {}, result: {} });
			}, [isReadOnly, isRevision, catalogName]);
		}

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

	private static _onDidCommand({ command }: OnDidCommandEv) {
		if (!GitIndexService._interestedCommands.has(command)) return;

		const lastRun = Date.now() - GitIndexService._lastRun;
		if (GitIndexService._timeout || lastRun < GitIndexService._debounceTime) {
			clearTimeout(GitIndexService._timeout);
			GitIndexService._timeout = setTimeout(() => void GitIndexService._update(), GitIndexService._debounceTime);
			return;
		}

		void GitIndexService._update();
	}

	private static async _update() {
		const endpoint = GitIndexService._apiUrlCreator.getVersionControlStatuses();
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
		GitIndexService._lastRun = Date.now();

		const catalogName = GitIndexService._catalogName;
		if (catalogName) {
			const changed = overview.added + overview.deleted + overview.modified;
			GitIndexService.events.emitSync("index-changed", { catalogName, changed });
		}
	}
}
