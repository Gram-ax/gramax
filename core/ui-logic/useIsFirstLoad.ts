import { useEffect, useState } from "react";

const useIsFirstLoad = () => {
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	useEffect(() => {
		setIsFirstLoad(false);
	}, [isFirstLoad]);

	return isFirstLoad;
};

export default useIsFirstLoad;
