import type ServerContext from "../../types/ServerContext";
import assert from "./assert";
import login from "./login";
import logout from "./logout";
import mailLoginOTP from "./mailLoginOTP";
import mailSendOTP from "./mailSendOTP";

const auth = async (serverContext: ServerContext) => {
	const { path, res } = serverContext;
	if (!path.pathname.startsWith("/api/auth")) return;

	await assert(serverContext);
	await login(serverContext);
	await logout(serverContext);
	await mailLoginOTP(serverContext);
	await mailSendOTP(serverContext);
	return res.getBunResponse();
};

export default auth;
