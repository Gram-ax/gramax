import useFetchCatalog from "@ext/git/core/GitFetch/logic/useFetchCatalog";
import useOnFirstLoadFuncs from "@core-ui/useOnFirstLoadFuncs";

const useOnUpdateFuncs = () => {
	useOnFirstLoadFuncs();
	useFetchCatalog();
};

export default useOnUpdateFuncs;
