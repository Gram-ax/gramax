import type UserSettings from "@app/types/UserSettings";
import type { UserSettingsSourceData } from "@app/types/UserSettings";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { Command, ResponseKind } from "../../types/Command";

const userSettings: Command<{ ctx: Context; userSettings: UserSettings }, string> = Command.create({
	path: "auth/userSettings",

	kind: ResponseKind.redirect,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ ctx, userSettings }) {
		const setStorage = async (sourceData: UserSettingsSourceData) => {
			if (sourceData.error) return console.log(sourceData.error);
			if (!(await makeSourceApi(sourceData, this._app.conf.authServiceUrl).isCredentialsValid()))
				throw Error("Invalid creds");
			await this._commands.storage.setSourceData.do({ ctx, ...sourceData });
		};

		await setStorage(userSettings.storageData);

		return userSettings.from;
	},

	params(ctx, q) {
		return { ctx, userSettings: JSON.parse(q.userSettings) };
	},
});

export default userSettings;
