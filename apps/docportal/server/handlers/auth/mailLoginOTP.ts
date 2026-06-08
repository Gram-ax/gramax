import type ServerContext from "../../types/ServerContext";

const mailLoginOTP = async (serverContext: ServerContext) => {
	const { path, req, res, app } = serverContext;
	if (path.pathname !== "/api/auth/mailLoginOTP") return;

	await app.am.mailLoginOTP(req, res);
};

export default mailLoginOTP;
