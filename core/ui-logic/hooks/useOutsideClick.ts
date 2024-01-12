import { useEffect } from "react";

export const useOutsideClick = (elements, callback, isActive) => {
	useEffect(() => {
		if (!isActive) return;

		const handleClickOutside = (event) => {
			const isOutside = elements.every((element) => {
				return element && !element.contains(event.target);
			});

			if (isOutside) callback();
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [elements, callback, isActive]);
};
