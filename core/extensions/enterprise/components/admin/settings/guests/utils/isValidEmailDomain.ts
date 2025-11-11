export const isValidEmailDomain = (domain: string): boolean => {
	const domainRegex = /^(?!-)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?<!-)$/;

	return domainRegex.test(domain);
};
