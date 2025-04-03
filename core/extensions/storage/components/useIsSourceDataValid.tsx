import useSourceData from "@ext/storage/components/useSourceData";

const useIsSourceDataValid = () => {
	const source = useSourceData();
	return !(!source || source.isInvalid);
};

export default useIsSourceDataValid;
