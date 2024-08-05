import t from "@ext/localization/locale/translate";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { Encoder } from "../../../Encoder/Encoder";
import IPermission from "../Permission/IPermission";
import Permission from "../Permission/Permission";
import User from "../User/User";

const authProp = "auth";
interface AuthProp {
	accessToken: string;
	groups: string[];
}

export class TicketManager {
	constructor(private _wm: WorkspaceManager, private _encoder: Encoder, private _shareAccessToken: string) {}

	public checkTicket(ticket: string): { catalogPermissions: { [catalogName: string]: IPermission }; user: User } {
		const catalogPermissions: { [catalogName: string]: IPermission } = {};

		const et = this._checkExternalTicket(ticket);
		if (et)
			et.forEach((per) => {
				catalogPermissions[per.catalogName] = per.permission;
			});

		const st = this._checkShareTicket(ticket);
		if (st) catalogPermissions[st.catalogName] = st.permission;

		const user = this._checkUserTicket(ticket);
		return { catalogPermissions, user };
	}

	public getShareTicket(catalogName: string, permission: IPermission, date: Date): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		return this._encoder.ecode(
			this._generateCatalogSharedDatas(catalogName, permission, date),
			this._shareAccessToken,
		);
	}

	public getUserTicket(user: User): string {
		if (!this._shareAccessToken) throw new Error(t("share-access-token-not-installed"));
		const date = new Date(new Date().getTime() + 3 * 60 * 1000); // Время действие тикета
		const datas = this._generateUserSharedDatas(user, date);
		return this._encoder.ecode(datas, this._shareAccessToken);
	}

	private _checkExternalTicket(ticket: string): { catalogName: string; permission: IPermission }[] {
		const catalogs = Array.from(this._wm.current().getCatalogEntries().values());
		const catalogsPermissions = [];
		catalogs.forEach((c) => {
			const auth: AuthProp = c.props[authProp];
			if (!auth?.accessToken) return;
			const data = this._encoder.decode(auth.accessToken, ticket);
			if (!data) return;
			const timeExpired = data?.[0];
			if (!timeExpired) return;
			const intTimeExpired = Number.parseInt(timeExpired, 10);
			if (intTimeExpired && Date.now() < intTimeExpired) {
				catalogsPermissions.push({
					catalogName: c.getName(),
					permission: new Permission(auth.groups ?? []),
				});
			}
		});
		return catalogsPermissions;
	}

	private _checkShareTicket(ticket: string): { catalogName: string; permission: IPermission } {
		const datas = this._encoder.decode(this._shareAccessToken, ticket);
		if (!datas) return null;
		const parseDatas = this._parseCatalogSharedDatas(datas);
		const intTimeExpired = parseDatas.date.valueOf();
		if (intTimeExpired && Date.now() < intTimeExpired)
			return { catalogName: parseDatas.catalogName, permission: parseDatas.permission };
		return;
	}

	private _checkUserTicket(ticket: string): User {
		const datas = this._encoder.decode(this._shareAccessToken, ticket);
		if (!datas) return null;
		const parseDatas = this._parseUserSharedDatas(datas);
		if (!parseDatas) return null;
		const intTimeExpired = parseDatas.date.valueOf();
		if (intTimeExpired && Date.now() < intTimeExpired) return parseDatas.user;
		return;
	}

	private _generateUserSharedDatas(user: User, date: Date): string[] {
		return [JSON.stringify(user.toJSON()), date.toJSON()];
	}
	private _parseUserSharedDatas(datas: string[]): { user: User; date: Date } {
		if (datas.length !== 2) return null;
		return { user: User.initInJSON(JSON.parse(datas[0])), date: new Date(datas[1]) };
	}

	private _generateCatalogSharedDatas(catalogName: string, permissions: IPermission, date: Date): string[] {
		return [catalogName, permissions?.toString(), date.toJSON()];
	}
	private _parseCatalogSharedDatas(datas: string[]): { catalogName: string; permission: IPermission; date: Date } {
		return { catalogName: datas[0], permission: new Permission(datas[1]), date: new Date(datas[2]) };
	}
}
