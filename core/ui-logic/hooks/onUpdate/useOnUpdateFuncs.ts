import useOnCatalogFirstClick from "@core-ui/hooks/onUpdate/useOnCatalogFirstClick";
import useOnFirstLoadFuncs from "@core-ui/useOnFirstLoadFuncs";
import useFetchCatalog from "@ext/git/core/GitFetch/logic/useFetchCatalog";

const useOnUpdateFuncs = () => {
	useOnFirstLoadFuncs();
	useFetchCatalog();
	useOnCatalogFirstClick();
};

export default useOnUpdateFuncs;
