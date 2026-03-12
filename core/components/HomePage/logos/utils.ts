export const getSrc = (image: typeof import("*.svg").default | typeof import("*.png").default) => {
	if (typeof image === "string") return image;
	return image.src;
};
