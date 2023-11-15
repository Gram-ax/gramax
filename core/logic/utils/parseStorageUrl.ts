const parseStorageUrl = (url: string): { domain?: string; group?: string; name?: string } => {
	const noDataObject = { domain: undefined, group: undefined, name: undefined };
	if (!url || !/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(url)) return noDataObject;
	const match = url.match(/(https?:\/\/|git@)?([^/:]*)[/:]?((.*)\/)?(.*?)(\.git)?$/i);
	if (!match) return noDataObject;
	return { domain: match[2], group: match[4], name: match[5] ? match[5] : undefined };
};

export default parseStorageUrl;
