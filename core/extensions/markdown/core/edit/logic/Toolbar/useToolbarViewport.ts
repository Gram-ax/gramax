import isMobileService from "@core-ui/ContextServices/isMobileService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { RefObject, useEffect, useRef } from "react";

declare global {
	interface VirtualKeyboard extends EventTarget {
		overlaysContent: boolean;
		boundingRect: DOMRect;
		addEventListener(type: "geometrychange", listener: (this: VirtualKeyboard, ev: Event) => void): void;
		removeEventListener(type: "geometrychange", listener: (this: VirtualKeyboard, ev: Event) => void): void;
	}

	interface Navigator {
		virtualKeyboard?: VirtualKeyboard;
	}
}

const setKeyboardHeightVar = (height: number) => {
	document.documentElement.style.setProperty("--keyboard-height", `${height}px`);
};

const useViewportAPI = (isMobile: boolean, toolbarRef: RefObject<HTMLDivElement>) => {
	useEffect(() => {
		if (!window.visualViewport || !isMobile) return;
		const toolbar: HTMLElement = toolbarRef.current;

		const updateToolbar = () => {
			requestAnimationFrame(() => {
				if (!window.visualViewport) return;

				const keyboardVisible = visualViewport.height < window.innerHeight;
				const newKeyboardHeight = keyboardVisible ? window.innerHeight - visualViewport.height : 0;
				toolbar.style.transform = `translateY(-${newKeyboardHeight}px)`;
				setKeyboardHeightVar(newKeyboardHeight);
			});
		};

		window.visualViewport.addEventListener("resize", updateToolbar);
		window.visualViewport.addEventListener("scroll", updateToolbar);

		return () => {
			window.visualViewport.removeEventListener("resize", updateToolbar);
			window.visualViewport.removeEventListener("scroll", updateToolbar);
			setKeyboardHeightVar(0);
		};
	}, [toolbarRef.current, isMobile]);
};

const useVirtualKeyboardAPI = (isMobile: boolean, toolbarRef: RefObject<HTMLDivElement>) => {
	useEffect(() => {
		if (!isMobile) return;

		const toolbar: HTMLElement = toolbarRef.current;
		if (!toolbar) return;

		const vk = navigator.virtualKeyboard;
		vk.overlaysContent = true;

		const handler = (e: Event) => {
			const target = e.target as VirtualKeyboard;
			const { height } = target.boundingRect;
			toolbar.style.transform = `translateY(-${height}px)`;
			setKeyboardHeightVar(height);
		};

		vk.addEventListener("geometrychange", handler);

		return () => {
			vk.removeEventListener("geometrychange", handler);
			setKeyboardHeightVar(0);
		};
	}, [toolbarRef.current, isMobile]);
};

export const useToolbarViewport = () => {
	const { isStatic, isStaticCli } = usePlatform();
	if (isStatic || isStaticCli) return null;

	const isMobile = isMobileService.value;
	const toolbarRef = useRef<HTMLDivElement>(null);
	if (!navigator) return;

	if ("virtualKeyboard" in navigator && navigator.virtualKeyboard) useVirtualKeyboardAPI(isMobile, toolbarRef);
	else useViewportAPI(isMobile, toolbarRef);

	return toolbarRef;
};
