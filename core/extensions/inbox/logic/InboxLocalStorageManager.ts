import { INBOX_LOCALSTORAGE_KEY } from "@ext/inbox/models/consts";
import { InboxArticleId, InboxArticleLocalStorageData, InboxLocalStorageData } from "@ext/inbox/models/types";

class InboxLocalStorageManager {
	private _data: InboxLocalStorageData;

	constructor() {
		this._data = this._load();
	}

	load() {
		return this._load();
	}

	update(id: InboxArticleId, data: Partial<InboxArticleLocalStorageData>) {
		this._data[id] = { ...this._data[id], ...data };
		this.save();
	}

	delete(id: InboxArticleId) {
		if (!this._data[id]) return;

		delete this._data[id];
		this.save();
	}

	save() {
		this._save();
	}

	getDataByID(id: InboxArticleId) {
		return this._data[id];
	}

	private _save() {
		localStorage.setItem(INBOX_LOCALSTORAGE_KEY, JSON.stringify(this._data));
	}

	private _load(): InboxLocalStorageData {
		const curData = localStorage.getItem(INBOX_LOCALSTORAGE_KEY);
		const data = curData ? JSON.parse(curData) : {};

		return data;
	}
}

export default InboxLocalStorageManager;
