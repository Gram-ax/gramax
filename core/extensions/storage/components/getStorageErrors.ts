import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import CatalogExistsError from "@ext/storage/components/CatalogExistsError";
import { ComponentProps, ReactNode } from "react";

export enum StorageError {
	CatalogExists = "catalog-exists",
}

const getStorageErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	[StorageError.CatalogExists]: CatalogExistsError,
});

export default getStorageErrors;
