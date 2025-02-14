import { useCallback, useEffect, useMemo, useState } from "react";

const useIsFirstLoad = () => {
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const resetIsFirstLoad = useCallback(() => {
		setIsFirstLoad(true);
	}, []);

	useEffect(() => {
		setIsFirstLoad(false);
	}, [isFirstLoad]);

	const result: [boolean, () => void] = useMemo(
		() => [isFirstLoad, resetIsFirstLoad],
		[isFirstLoad, resetIsFirstLoad],
	);
	return result;
};

export default useIsFirstLoad;
