import Context from "@core/Context/Context";
import Permission from "@ext/security/logic/Permission/Permission";
import User from "@ext/security/logic/User/User";
import { KEYUTIL, KJUR } from "jsrsasign";
import { Command, ResponseKind } from "../../types/Command";

const sso: Command<{ ctx: Context; data: string; sign: string; from: string }, string> = Command.create({
	path: "auth/sso",

	kind: ResponseKind.redirect,

	middlewares: [],

	do({ ctx, data, sign, from }) {
		const publicKey = KEYUTIL.getKey(this._app.conf.ssoPublicKey);
		const userData = decodeURIComponent(data);
		const signature = decodeURIComponent(sign);
		const sig = new KJUR.crypto.Signature({ alg: "SHA256withRSA" });

		sig.init(publicKey);
		sig.updateString(userData);

		if (!sig.verify(signature)) {
			console.error("Signature verification failed.");
			return "/";
		}

		const userInfo = JSON.parse(userData);
		const user = new User(true, userInfo.userInfo, new Permission(userInfo.globalPermission));
		ctx.cookie.set("user", JSON.stringify(user));
		return from;
	},

	params(ctx, q) {
		return { ctx, data: q.data, sign: q.sign, from: q.from };
	},
});

export default sso;
