import { useEffect, useRef } from "react";

export const useCtrlKey = () => {
	const { current } = useRef({ isCtrlPressed: false });

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.ctrlKey) current.isCtrlPressed = true;
	};

	const handleKeyUp = (event: KeyboardEvent) => {
		if (!event.ctrlKey) current.isCtrlPressed = false;
	};

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	return { isCtrlPressed: current.isCtrlPressed };
};
