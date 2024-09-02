export const showPopover = (message: string) => {
	const popover = document.createElement("div");

	popover.className = "popover";

	popover.textContent = message;

	document.body.appendChild(popover);

	requestAnimationFrame(() => {
		popover.style.opacity = "1";
	});

	setTimeout(() => {
		popover.style.opacity = "0";
		setTimeout(() => {
			popover.remove();
		}, 500);
	}, 2000);
};
