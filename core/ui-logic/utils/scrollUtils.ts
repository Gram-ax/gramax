const scrollUtils = {
	scrollPositionIsTop(element: HTMLElement, threshold: number = 2): boolean {
		return element.scrollTop < threshold;
	},

	scrollPositionIsBottom(element: HTMLElement, threshold: number = 2): boolean {
		return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
	},

	addTopBottomPositionClass(element: HTMLElement) {
		const onScroll = () => {
			scrollUtils.setScrollPositionClass(element);
		};
		if (element.onscroll?.toString() !== onScroll.toString()) element.onscroll = onScroll;
		onScroll();
	},

	setScrollPositionClass(element: HTMLElement, topClassName = " top", bottomClassName = " bottom") {
		if (scrollUtils.scrollPositionIsBottom(element)) {
			if (!element.className.includes(bottomClassName)) element.className += bottomClassName;
		} else element.className = element.className.replaceAll(bottomClassName, "");

		if (scrollUtils.scrollPositionIsTop(element)) {
			if (!element.className.includes(topClassName)) element.className += topClassName;
		} else element.className = element.className.replaceAll(topClassName, "");
	},

	hasScroll(element: HTMLElement, threshold: number = 1): boolean {
		return Math.abs(element.scrollHeight - element.clientHeight) > threshold;
	},

	scrollToWithCallback(element: Element, offset: number, callback: () => void): void {
		const fixedOffset = offset.toFixed();
		const onScroll = () => {
			if (element.scrollTop.toFixed() === fixedOffset) {
				element.removeEventListener("scroll", onScroll);
				callback();
			}
		};

		element.addEventListener("scroll", onScroll);
		onScroll();
		element.scrollTo({
			top: offset,
			behavior: "smooth",
		});
	},
};

export default scrollUtils;
