import { EnterpriseConfig } from "@app/config/AppConfig";
import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import t from "@ext/localization/locale/translate";
import TokenValidationError from "@ext/publicApi/TokenValidationError";
import TicketUser from "@ext/security/logic/TicketManager/TicketUser";
import { Encoder } from "../../../Encoder/Encoder";
import IPermission from "../Permission/IPermission";
import Permission from "../Permission/Permission";

export class TicketManager {
	constructor(
		private _encoder: Encoder,
		private _shareAccessToken: string,
		private _enterpriseConfig?: EnterpriseConfig,
	) {}

	checkShareTicket(ticket: string) {
		const st = this._checkShareTicket(ticket);
		const user = new TicketUser();
		if (st) {
			const values = st.permission.getValues();
			if (values?.length) {
				const newValues = values.filter((v) => !v.includes("@"));
				st.permission = new Permission(newValues);
			}
			user.addCatalogPermission(st.catalogName, st.permission);
		}

		return user;
	}

	checkUserTicket(ticket: string) {
		return this._checkUserTicket(ticket);
	}

	getShareTicket(catalogName: string, permission: IPermission, date: Date): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		return this._encoder.ecode(
			this._generateCatalogSharedDatas(catalogName, permission, date),
			this._shareAccessToken,
		);
	}

	getUserToken(user: EnterpriseUser, expiresAt: Date): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		return this._encoder.ecode(this._generateUserSharedDatas(user, expiresAt), this._shareAccessToken);
	}

	private _checkShareTicket(ticket: string): { catalogName: string; permission: IPermission } {
		const datas = this._encoder.decode(this._shareAccessToken, ticket);
		if (!datas) return null;
		const parseDatas = this._parseCatalogSharedDatas(datas);
		if (!parseDatas) return null;
		const intTimeExpired = parseDatas.date.valueOf();
		if (intTimeExpired && Date.now() < intTimeExpired) {
			return { catalogName: parseDatas.catalogName, permission: parseDatas.permission };
		}
		return;
	}

	private async _checkUserTicket(ticket: string): Promise<EnterpriseUser> {
		if (!this._enterpriseConfig?.gesUrl) return null;
		const datas = this._encoder.decode(this._shareAccessToken, ticket);
		const { token, date } = this._parseUserSharedDatas(datas);

		if (new Date(date).valueOf() < Date.now()) throw new TokenValidationError("Token has expired");

		const user = new EnterpriseUser(true, null, null, null, null, this._enterpriseConfig, token);
		return await user.updatePermissions(false);
	}

	private _generateUserSharedDatas(user: EnterpriseUser, expiresAt: Date): string[] {
		return [user.token, expiresAt.toJSON()];
	}

	private _parseUserSharedDatas(datas: string[]) {
		if (!datas || datas.length !== 2) throw new TokenValidationError("Invalid token");
		const [token, date] = datas;
		return { token, date };
	}

	private _generateCatalogSharedDatas(catalogName: string, permissions: IPermission, date: Date): string[] {
		return [catalogName, permissions?.toString(), date.toJSON()];
	}
	private _parseCatalogSharedDatas(datas: string[]): { catalogName: string; permission: IPermission; date: Date } {
		if (datas.length !== 3) return null;
		return { catalogName: datas[0], permission: new Permission(datas[1]), date: new Date(datas[2]) };
	}
}
