import { useCallback, useRef, useState } from "react";

interface UseOpenStateArgs {
	keyBase?: string;
}

export const useOpenState = (args?: UseOpenStateArgs) => {
	const keyOrdRef = useRef(0);
	const keyBaseRef = useRef(args?.keyBase ?? "");
	const [isOpen, setIsOpen] = useState(false);
	const [key, setKey] = useState(() => `${keyBaseRef.current}-${keyOrdRef.current}`);

	const open = useCallback(() => {
		keyOrdRef.current++;
		setIsOpen(true);
		setKey(`${keyBaseRef.current}-${keyOrdRef.current}`);
	}, []);
	const close = useCallback(() => setIsOpen(false), []);

	return { isOpen, setIsOpen, open, close, key };
};
