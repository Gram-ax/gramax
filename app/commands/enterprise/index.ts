import addWorkspace from "./addWorkspace";
import checkEditWorkspace from "./checkEditWorkspace";
import cloneCatalogs from "./cloneCatalogs";
import logout from "./logout";
import modules from "./modules";
import getNotifications from "./notifications/get";
import updateNotifications from "./notifications/update";
import quiz from "./quiz";
import refreshWorkspace from "./refreshWorkspace";
import setGesUrl from "./setGesUrl";

const enterprise = {
	addWorkspace,
	cloneCatalogs,
	logout,
	checkEditWorkspace,
	quiz,
	modules,
	refreshWorkspace,
	setGesUrl,
	notifications: {
		get: getNotifications,
		update: updateNotifications,
	},
};

export default enterprise;
