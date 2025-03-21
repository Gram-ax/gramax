import { useCallback, useLayoutEffect, useState } from "react";

const useIsFirstLoad = (): [boolean, () => void] => {
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const resetIsFirstLoad = useCallback(() => {
		setIsFirstLoad(true);
	}, []);

	useLayoutEffect(() => {
		setIsFirstLoad(false);
	}, [isFirstLoad]);

	return [isFirstLoad, resetIsFirstLoad];
};

export default useIsFirstLoad;
