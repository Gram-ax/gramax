import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import type { FsEventDto } from "@ext/Watchers/FsEvent";
import { type FsHandleResult, handleFsEvents } from "@ext/Watchers/FsEventsHandler";
import { Command } from "../../types/Command";

const handleEvents: Command<
	{ events: FsEventDto[]; currentPath?: string; catalogName?: string; ctx: Context },
	FsHandleResult
> = Command.create({
	path: "fs/handleEvents",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, events, currentPath, catalogName }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.maybeCurrent();

		return handleFsEvents({
			events,
			catalogName: catalogName ?? "",
			currentPath,
			workspace,
			sitePresenterFactory,
			ctx,
		});
	},

	params(ctx, _, body) {
		const data = body as { events?: FsEventDto[]; currentPath?: string; catalogName?: string };
		return {
			ctx,
			events: data?.events ?? [],
			currentPath: data?.currentPath,
			catalogName: data?.catalogName,
		};
	},
});

export default handleEvents;
