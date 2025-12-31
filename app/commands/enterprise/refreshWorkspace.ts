import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const refreshWorkspace: Command<void, void> = Command.create({
	path: "enterprise/refreshWorkspace",

	kind: ResponseKind.none,

	async do() {
		await this._app.wm.current().config(true);
	},
});

export default refreshWorkspace;
