import type ServerContext from "../types/ServerContext";

const health = async (serverContext: ServerContext) => {
	const { res, path, app } = serverContext;
	if (path.pathname !== "/api/health/") return;

	if (!app.healthcheckRegistry) {
		res.statusCode = 200;
		res.send(JSON.stringify({ status: "healthy", checks: {} }));
		return;
	}

	const result = await app.healthcheckRegistry.checkAll();
	res.statusCode = result.status === "healthy" ? 200 : 503;
	res.send(JSON.stringify(result));
};

export default health;
