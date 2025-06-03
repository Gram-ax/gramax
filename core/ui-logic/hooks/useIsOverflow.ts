import { MutableRefObject, useEffect, useState } from "react";

const useIsOverflow = (ref: MutableRefObject<HTMLElement>) => {
	const [isOverflow, setIsOverflow] = useState<boolean>(undefined);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const hasOverflow = element.scrollWidth > element.clientWidth;

		setIsOverflow(hasOverflow);
	}, [ref]);

	return isOverflow;
};

export default useIsOverflow;
