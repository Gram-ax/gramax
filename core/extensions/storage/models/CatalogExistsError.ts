import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { StorageError } from "@ext/storage/components/getStorageErrors";

export default class CatalogExistsError extends DefaultError {
	constructor(storage: string, name: string) {
		super(
			`В хранилище ${storage} каталог ${name} уже существует.\nИзмените поле "Название репозитория" в настройках каталога.`,
			undefined,
			{ storage, name },
		);
	}

	get props(): { [key: string]: any } & { errorCode: string } {
		return { ...this._props, errorCode: StorageError.CatalogExists };
	}
}
