import useOnCatalogFirstClick from "@core-ui/hooks/onUpdate/useOnCatalogFirstClick";
import useOnFirstLoadFuncs from "@core-ui/useOnFirstLoadFuncs";
import useFetchCatalog from "@ext/git/core/GitFetch/logic/useFetchCatalog";
import useOnCatalogOpen from "@ext/git/migration/useOnCatalogOpen";

const useOnUpdateFuncs = () => {
	useOnFirstLoadFuncs();
	useFetchCatalog();
	useOnCatalogOpen();
	useOnCatalogFirstClick();
};

export default useOnUpdateFuncs;
