import { useState, useEffect } from "react";

export const useCtrlKey = () => {
	const [isCtrlPressed, setIsCtrlPressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey) setIsCtrlPressed(true);
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (!event.ctrlKey) setIsCtrlPressed(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	return { isCtrlPressed };
};
