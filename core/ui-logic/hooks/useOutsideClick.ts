import { useEffect } from "react";

type OutsideClick = <T extends HTMLElement>(
	elements: T[],
	callback: (e: MouseEvent) => void,
	isActive?: boolean,
) => void;

export const useOutsideClick: OutsideClick = (elements, callback, isActive = true) => {
	useEffect(() => {
		if (!isActive) return;

		const handleClickOutside = (event) => {
			const isOutside = elements.every((element) => {
				return element && !element.contains(event.target);
			});

			if (isOutside) callback(event);
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [elements, callback, isActive]);
};
