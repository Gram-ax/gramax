export interface StorageUrl {
	protocol?: string;
	domain?: string;
	group?: string;
	name?: string;
	origin?: string;
}

const noDataObject: StorageUrl = { protocol: null, domain: null, group: null, name: null, origin: null };

const parseStorageUrl = (url: string): StorageUrl => {
	if (!url) return noDataObject;
	if (url.startsWith("git@")) return sshUrlParser(url);
	if (!url.includes("://")) url = `https://${url}`;

	return httpUrlParser(url);
};

const sshUrlParser = (url: string) => {
	try {
		const [userDomain, path] = url.split(":");
		if (!userDomain || !path) return noDataObject;

		const domain = userDomain.split("@")[1];
		const pathname = path.split("/");
		const group = pathname.length > 1 ? pathname.slice(0, -1).join("/") : null;
		const name = pathname[pathname.length - 1]?.replace(/\.git$/, "") ?? null;

		return { protocol: "git@", domain, group, name, origin: `git@${domain}` };
	} catch (error) {
		console.log("Failed to parse SSH url: ", error);
		return noDataObject;
	}
};

const httpUrlParser = (url: string) => {
	try {
		const urlObject = new URL(url);
		if (!urlObject) return noDataObject;

		const protocol = urlObject?.protocol?.replace(":", "");

		const pathname = urlObject?.pathname?.split("/")?.filter(Boolean);
		const group = pathname?.slice(0, -1)?.join("/") || null;
		const name = pathname?.[pathname.length - 1]?.replace(".git", "") || null;

		return { protocol, domain: urlObject.host, origin: urlObject.origin, group, name };
	} catch (error) {
		console.log("Failed to parse url: ", error);
		return noDataObject;
	}
};

export default parseStorageUrl;
