import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import Workspace from "@core-ui/ContextServices/Workspace";

const isUrlPointsToRepo = async (url: string) => {
	if (url.endsWith("/")) url = url.slice(0, -1);
	if (!url.endsWith(".git")) url += ".git";
	url += "/info/refs?service=git-upload-pack";

	try {
		const res = await getInfoRefs(url);
		if (!res) return false;
		const contentType = res.contentType;
		if (!contentType) return false;
		return contentType === "application/x-git-upload-pack-advertisement";
	} catch {
		return false;
	}
};

const getInfoRefs = async (url: string) => {
	const [protocol, href] = url.includes("://") ? url.split("://") : ["http", url];

	if (getExecutingEnvironment() === "tauri") {
		const makeRequest = resolveModule("httpFetch");
		return await makeRequest({ url, headers: { "x-protocol": protocol } });
	} else {
		const corsProxy = Workspace.current()?.services.gitProxy.url;
		if (!corsProxy) return false;

		const proxiedUrl = corsProxy + "/" + href;
		const res = await fetch(new URL(proxiedUrl), { headers: { "x-protocol": protocol } });
		return { status: res.status, contentType: res.headers.get("content-type") };
	}
};

export default isUrlPointsToRepo;
