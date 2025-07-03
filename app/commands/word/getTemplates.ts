import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const getTemplates: Command<{ ctx: Context }, string[]> = Command.create({
	path: "word/getTemplates",
	kind: ResponseKind.json,

	async do() {
		const { wm, wtm } = this._app;
		const workspace = wm.current();
		return (await wtm.from(workspace)).getTemplates();
	},
});

export default getTemplates;
