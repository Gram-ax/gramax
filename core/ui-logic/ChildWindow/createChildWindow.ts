import resolveModule from "@app/resolveModule";

const createChildWindow = async (
	url: string,
	width = 700,
	height = 550,
	redirect?: string,
	callback?: (finalLocation: Location) => void,
) => {
	const name = "_blank";
	const screenWidth = window.screen.width;
	const screenHeight = window.screen.height;
	const left = (screenWidth - width) / 2;
	const top = (screenHeight - height) / 2;

	const features = `width=${width},height=${height},left=${left},top=${top}`;

	const child = await resolveModule("openChildWindow")({ url, redirect, name, features });
	(window as any).onLoadApp = (data) => callback(data);
	(child as any).onLoadApp = (data) => callback(data);
};

export default createChildWindow;
