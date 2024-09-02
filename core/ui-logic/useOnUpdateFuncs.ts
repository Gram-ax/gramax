import useOnFirstLoadFuncs from "@core-ui/useOnFirstLoadFuncs";
import useCheckCatalogMergeConflicts from "@ext/git/actions/MergeConflictHandler/error/logic/useCheckCatalogMergeConflicts";
import useFetchCatalog from "@ext/git/core/GitFetch/logic/useFetchCatalog";

const useOnUpdateFuncs = () => {
	useOnFirstLoadFuncs();
	useFetchCatalog();
	useCheckCatalogMergeConflicts();
};

export default useOnUpdateFuncs;
