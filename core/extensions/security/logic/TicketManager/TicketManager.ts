import EnterpriseUser from "@ext/enterprise/EnterpriseUser";
import t from "@ext/localization/locale/translate";
import { Encoder } from "../../../Encoder/Encoder";
import IPermission from "../Permission/IPermission";
import Permission from "../Permission/Permission";

export class TicketManager {
	constructor(private _encoder: Encoder, private _shareAccessToken: string, private _gesUrl?: string) {}

	public async checkTicket(ticket: string) {
		const catalogPermissions: { [catalogName: string]: IPermission } = {};

		const st = this._checkShareTicket(ticket);
		if (st) catalogPermissions[st.catalogName] = st.permission;

		const user = await this._checkUserTicket(ticket);

		return { catalogPermissions, user };
	}

	public getShareTicket(catalogName: string, permission: IPermission, date: Date): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		return this._encoder.ecode(
			this._generateCatalogSharedDatas(catalogName, permission, date),
			this._shareAccessToken,
		);
	}

	public getUserToken(user: EnterpriseUser): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		return this._encoder.ecode(this._generateUserSharedDatas(user), this._shareAccessToken);
	}

	private _checkShareTicket(ticket: string): { catalogName: string; permission: IPermission } {
		const datas = this._encoder.decode(this._shareAccessToken, ticket);
		if (!datas) return null;
		const parseDatas = this._parseCatalogSharedDatas(datas);
		if (!parseDatas) return null;
		const intTimeExpired = parseDatas.date.valueOf();
		if (intTimeExpired && Date.now() < intTimeExpired)
			return { catalogName: parseDatas.catalogName, permission: parseDatas.permission };
		return;
	}

	private async _checkUserTicket(ticket: string): Promise<EnterpriseUser> {
		const token = this._encoder.decode(this._shareAccessToken, ticket);
		if (!token) return null;
		return await this._parseUserSharedDatas(token);
	}

	private _generateUserSharedDatas(user: EnterpriseUser): string[] {
		return [user.token];
	}
	private async _parseUserSharedDatas(datas: string[]): Promise<EnterpriseUser> {
		if (datas.length !== 1) return null;
		if (!this._gesUrl) return null;
		const user = new EnterpriseUser(true, null, null, null, null, this._gesUrl, datas[0]);
		return await user.updatePermissions();
	}

	private _generateCatalogSharedDatas(catalogName: string, permissions: IPermission, date: Date): string[] {
		return [catalogName, permissions?.toString(), date.toJSON()];
	}
	private _parseCatalogSharedDatas(datas: string[]): { catalogName: string; permission: IPermission; date: Date } {
		if (datas.length !== 3) return null;
		return { catalogName: datas[0], permission: new Permission(datas[1]), date: new Date(datas[2]) };
	}
}
