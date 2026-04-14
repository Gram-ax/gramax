import type ServerContext from "../types/ServerContext";
import fileResponse from "../utils/fileResponse";

const clientAssets = async (ctx: ServerContext) => {
	const { path } = ctx;
	const distDir = `${process.cwd()}/dist`;
	if (path.pathname.startsWith("/assets/")) {
		const file = Bun.file(`${distDir}/${path.pathname.slice(1)}`);
		if (await file.exists()) return fileResponse(file);
		return new Response("Not Found", { status: 404 });
	}

	const file = Bun.file(`${distDir}${path.pathname}`);
	if (await file.exists()) return fileResponse(file);
};

export default clientAssets;
