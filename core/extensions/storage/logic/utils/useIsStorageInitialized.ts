import useStorage from "@ext/storage/logic/utils/useStorage";

const useIsStorageInitialized = (): boolean => {
	return !!useStorage();
};

export default useIsStorageInitialized;
