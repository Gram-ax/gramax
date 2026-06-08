const parseRequestBody = async (req: Request): Promise<unknown> => {
	if (!req.body) return undefined;

	const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
	const clonedReq = req.clone();

	if (contentType.includes("application/json")) {
		try {
			return await clonedReq.json();
		} catch {
			return await clonedReq.text();
		}
	}

	return await clonedReq.text();
};

export default parseRequestBody;
