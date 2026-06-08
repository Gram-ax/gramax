import type ServerContext from "../../types/ServerContext";

const mailSendOTP = async (serverContext: ServerContext) => {
	const { path, req, res, app } = serverContext;
	if (path.pathname !== "/api/auth/mailSendOTP") return;

	await app.am.mailSendOTP(req, res);
};

export default mailSendOTP;
