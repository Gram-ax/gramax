import generateUniqueID from "@core/utils/generateUniqueID";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";

type CreateViewModelProps = Omit<CatalogView, "id"> & { id?: string };

const createViewModel = ({ id, name, filters = [], properties = [], options }: CreateViewModelProps): CatalogView => {
	return {
		id: id || generateUniqueID(),
		name: name,
		filters,
		properties,
		options,
	};
};

export default createViewModel;
