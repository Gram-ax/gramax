import GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import CatalogExistsError from "@ext/storage/components/CatalogExistsError";
import InvalidSourceDataError from "@ext/storage/logic/SourceDataProvider/components/InvalidSourceDataError";
import { InvalidSourceDataErrorCode } from "@ext/storage/logic/SourceDataProvider/error/InvalidSourceData";
import { ComponentProps, ReactNode } from "react";

export enum StorageError {
	CatalogExists = "catalog-exists",
}

const getStorageErrors = (): {
	[key: string]: (args: ComponentProps<typeof GetErrorComponent>) => ReactNode;
} => ({
	[StorageError.CatalogExists]: CatalogExistsError,
	[InvalidSourceDataErrorCode]: InvalidSourceDataError,
});

export default getStorageErrors;
