import { useEffect, useRef, useState, MutableRefObject } from "react";

const useElementExistence = (ref: MutableRefObject<Element>) => {
	const observerRef = useRef<MutationObserver>(null);
	const [exists, setExists] = useState(true);

	useEffect(() => {
		const observerCallback: MutationCallback = (mutationsList) => {
			mutationsList.some((mutation) => mutation.type === "childList") && document.body.contains(ref.current)
				? setExists(true)
				: setExists(false);
		};

		observerRef.current = new MutationObserver(observerCallback);

		if (ref.current) {
			observerRef.current.observe(document.body, { childList: true, subtree: true });
		}

		return () => observerRef.current?.disconnect();
	}, [ref.current]);

	return exists;
};

export default useElementExistence;
