import type ServerContext from "../../types/ServerContext";

const login = async (serverContext: ServerContext) => {
	const { path, req, res, app } = serverContext;
	if (path.pathname !== "/api/auth/login") return;

	await app.am.login(req, res);
};

export default login;
