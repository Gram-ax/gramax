const getExampleStorageLink = ({ protocol, domain }: { protocol?: string; domain: string }) => {
	return `${protocol ?? "https"}://${domain}/<group-name>/<repository-name>`;
};

export default getExampleStorageLink;
