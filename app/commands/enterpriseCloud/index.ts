import logout from "@app/commands/enterpriseCloud/logout";
import addWorkspace from "./addWorkspace";
import disableCloud from "./disableCloud";
import enableCloud from "./enableCloud";
import initNewCatalog from "./initNewCatalog";

const enterpriseCloud = {
	addWorkspace,
	initNewCatalog,
	disableCloud,
	enableCloud,
	logout,
};

export default enterpriseCloud;
