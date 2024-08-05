import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import { StorageError } from "@ext/storage/components/getStorageErrors";

export default class CatalogExistsError extends DefaultError {
	constructor(storage: string, name: string) {
		super(
			t("git.source.error.catalog-exist").replace("{{storage}}", storage).replace("{{name}}", name),
			undefined,
			{ storage, name },
		);
	}

	get props(): { [key: string]: any } & { errorCode: string } {
		return { ...this._props, errorCode: StorageError.CatalogExists };
	}
}
