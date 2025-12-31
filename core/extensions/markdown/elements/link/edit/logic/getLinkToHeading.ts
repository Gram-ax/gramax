export const getLinkToHeading = (href: string) => {
	return href.match(/^(.*?)(#.+)$/);
};
