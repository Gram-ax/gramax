const parseStorageUrl = (url: string): { protocol?: string; domain?: string; group?: string; name?: string } => {
	const noDataObject = { protocol: undefined, domain: undefined, group: undefined, name: undefined };
	if (!url || !/[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(url)) return noDataObject;
	const match = url.match(/^(https?|git@)?(:\/\/)?([^/:]*)([/:]?((.*)\/)?(.*?))(\.git)?$/i);
	if (!match) return noDataObject;
	const protocol = match[1] ? match[1].replace(":", "") : undefined;
	const domain = match[3];
	const group = match[6];
	const name = match[7] ? match[7] : undefined;
	return { protocol, domain, group, name };
};

export default parseStorageUrl;
