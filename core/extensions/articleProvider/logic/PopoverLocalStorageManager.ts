import { PopoverRect } from "@ext/articleProvider/logic/Popover";
import { ItemID } from "@ext/articleProvider/models/types";

export type PopoverLocalStorageData<T> = T & {
	[key: ItemID]: PopoverItemStorageData;
};

export type PopoverItemStorageData = {
	rect: PopoverRect;
};

class PopoverLocalStorageManager {
	private _key: string;
	private _data: PopoverLocalStorageData<unknown>;

	constructor(key: string) {
		this._key = key;
		this._data = this._load();
	}

	load() {
		return this._load();
	}

	update(id: ItemID, data: Partial<PopoverItemStorageData>) {
		this._data[id] = { ...this._data[id], ...data };
		this.save();
	}

	delete(id: ItemID) {
		if (!this._data[id]) return;

		delete this._data[id];
		this.save();
	}

	save() {
		this._save();
	}

	getDataByID(id: ItemID) {
		return this._data[id];
	}

	private _save() {
		localStorage.setItem(this._key, JSON.stringify(this._data));
	}

	private _load(): PopoverLocalStorageData<unknown> {
		const curData = localStorage.getItem(this._key);
		const data = curData ? JSON.parse(curData) : {};

		return data;
	}
}

export default PopoverLocalStorageManager;
