import isMobileService from "@core-ui/ContextServices/isMobileService";
import { useCallbackRef } from "@core-ui/hooks/useCallbackRef";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseHoverDropdownOptions {
	preventClose?: () => boolean;
}

export const useHoverDropdown = (openDelay: number = 150, options?: UseHoverDropdownOptions) => {
	const isMobile = isMobileService.value;
	const [isOpen, setIsOpen] = useState(false);
	const openTimeoutRef = useRef<NodeJS.Timeout>(null);
	const closeTimeoutRef = useRef<NodeJS.Timeout>(null);

	const handleMouseEnter = useCallback(() => {
		if (isMobile) return;

		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current);
			closeTimeoutRef.current = null;
		}

		openTimeoutRef.current = setTimeout(() => {
			setIsOpen(true);
		}, openDelay);
	}, [openDelay, isMobile]);

	const handleMouseLeave = useCallback(() => {
		if (isMobile) return;

		if (openTimeoutRef.current) {
			clearTimeout(openTimeoutRef.current);
			openTimeoutRef.current = null;
		}

		closeTimeoutRef.current = setTimeout(() => {
			setIsOpen(false);
		}, 150);
	}, [isMobile]);

	const handleMouseLeaveRef = useCallbackRef(handleMouseLeave);

	useEffect(() => {
		const onWindowBlur = () => {
			if (options?.preventClose?.()) return;
			handleMouseLeaveRef();
		};

		window.addEventListener("blur", onWindowBlur);
		return () => {
			window.removeEventListener("blur", onWindowBlur);
		};
	}, [options]);

	return { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave };
};
