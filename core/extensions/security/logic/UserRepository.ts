import UserInfo from "./User/UserInfo";

export interface UserRepositoryProvider {
	getUser(idOrMail: string): Promise<UserInfo>;
}

export default class UserRepository {
	constructor(private _ur: UserRepositoryProvider) {}
	private _Users: Map<string, UserInfo> = new Map();

	async getUser(idOrMail: string) {
		if (this._Users.has(idOrMail)) return this._Users.get(idOrMail);
		const user = await this._ur.getUser(idOrMail);
		if (!user) return null;
		this._setUser(user);
		return this._Users.get(idOrMail);
	}

	private _setUser(user: UserInfo) {
		this._Users.set(user?.id, user);
		this._Users.set(user?.mail, user);
	}
}
