import assert from "assert";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import { ExtendedWindow, InitialDataKeys } from "./types";

export const getCatalogNameFromInitialData = (): string => {
	const extendedWindow = window as ExtendedWindow;
	const data = extendedWindow[InitialDataKeys.DATA];

	assert(data, "Initial data not found");
	return data.data.catalogProps.name;
};

export const getBaseCatalogName = () => {
	const catalogName = getCatalogNameFromInitialData();
	return BaseCatalog.parseName(catalogName).name;
};
