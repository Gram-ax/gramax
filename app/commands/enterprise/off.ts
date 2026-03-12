import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const offEnterprise: Command<void, void> = Command.create({
	path: "enterprise/off",

	kind: ResponseKind.none,

	async do() {
		this._app.em.off();
	},
});

export default offEnterprise;
