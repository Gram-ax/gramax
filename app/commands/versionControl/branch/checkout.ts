import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import StorageСhecker from "@ext/storage/logic/StorageСhecker";
import { Command, ResponseKind } from "../../../types/Command";

const checkout: Command<{ ctx: Context; catalogName: string; branch: string }, void> = Command.create({
	path: "versionControl/branch/checkout",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, branch }) {
		const { lib, sp } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const vc = await catalog.getVersionControl();

		const source = sp.getSourceData(ctx.cookie, await catalog.getStorage().getSourceName());
		const vcBranch = await vc.getBranch(branch);
		await new StorageСhecker().checkBranch(await catalog.getStorage().getData(source), vcBranch);

		const oldVersion = await vc.getCurrentVersion();
		const oldBranch = await vc.getCurrentBranch();
		await vc.checkoutToBranch(branch);
		await vc.update();
		const newVersion = await vc.getCurrentVersion();

		await vc.checkChanges(oldVersion, newVersion);

		try {
			await this._commands.storage.pull.index.do({ ctx, catalogName });
		} catch (e) {
			await vc.checkoutToBranch(oldBranch.toString());
			throw e;
		}
	},

	params(ctx, q) {
		const branch = q.branch;
		const catalogName = q.catalogName;
		return { ctx, branch, catalogName };
	},
});

export default checkout;
