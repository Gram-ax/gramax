import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import { Command } from "../../types/Command";

const sso: Command<{ ctx: Context; data: string; sign: string; from: string }, string> = Command.create({
	path: "auth/sso",

	kind: ResponseKind.redirect,

	async do({ ctx, data, sign, from }) {
		const isDocportal = getExecutingEnvironment() === "next";
		const gesUrl = isDocportal ? null : localStorage?.getItem("gesUrl");
		// const publicKey = KEYUTIL.getKey(this._app.conf.services.sso.publicKey);
		const userData = Buffer.from(decodeURIComponent(data.replace("\\", "/")), "base64");
		// const signature = decodeURIComponent(sign);
		// console.log(publicKey, userData, signature)
		// const sig = new KJUR.crypto.Signature({ alg: "SHA256withRSA" });
		// sig.init(publicKey);
		// sig.updateString(userData);

		// if (!sig.verify(signature)) {
		// 	console.error("Signature verification failed.");
		// 	return "/";
		// }

		const decodedUserData = userData.toString();
		const parsedUserData = JSON.parse(decodedUserData);

		const isEditor =
			gesUrl &&
			(await fetch(
				`${gesUrl}/enterprise/check-editor?${new URLSearchParams({
					userMail: parsedUserData.userInfo.mail,
				}).toString()}`,
			));

		if (!isDocportal && !isEditor?.ok)
			throw new DefaultError(
				t("enterprise.check-if-user-editor-warning"),
				null,
				{},
				true,
				t("enterprise.access-restricted"),
			);

		const user = new User(true, parsedUserData.userInfo, new Permission(parsedUserData.globalPermission));
		ctx.cookie.set("user", JSON.stringify(user.toJSON()), undefined);

		if (gesUrl) return `${gesUrl}/enterprise/userSettings?${new URLSearchParams({
			from,
			gramaxDomain: ctx.domain
		}).toString()}`;

		return from;
	},

	params(ctx, q) {
		return { ctx, data: q.data, sign: q.sign, from: q.from };
	},
});

export default sso;
