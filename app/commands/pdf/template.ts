import { ResponseKind } from "@app/types/ResponseKind";
import { Command } from "../../types/Command";

const template: Command<{ name: string }, Buffer> = Command.create({
	path: "pdf/template",
	kind: ResponseKind.file,

	async do({ name }) {
		const { ptm, wm } = this._app;
		const template = (await ptm.from(wm.current())).getTemplate(name);
		return template;
	},

	params(_, q) {
		const name = q.name;
		return { name };
	},
});

export default template;
