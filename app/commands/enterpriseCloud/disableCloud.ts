import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const disableCloud: Command<void, void> = Command.create({
	path: "enterpriseCloud/disableCloud",

	kind: ResponseKind.none,

	async do() {
		const { enterpriseCloudManager } = this._app;
		await enterpriseCloudManager.disable();
	},
});

export default disableCloud;
