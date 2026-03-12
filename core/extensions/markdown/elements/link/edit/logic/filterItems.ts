export type ItemSearchData = {
	label: string;
	pathname: string;
};

export const filterItems = (option: ItemSearchData, searchValue: string): boolean => {
	if (!option?.label || !option?.pathname || option.label === "" || option.pathname === "") return true;
	const cleanedSearchValue = searchValue.split("#")[0];
	return (
		cleanedSearchValue === "" ||
		option.label.toLowerCase().includes(cleanedSearchValue.toLowerCase()) ||
		option.pathname.toLowerCase().includes(cleanedSearchValue.toLowerCase())
	);
};
