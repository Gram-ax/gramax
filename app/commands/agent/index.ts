import messageSend from "./message/send";
import sessionCancel from "./session/cancel";
import createSession from "./session/create";
import sessionDelete from "./session/delete";
import sessionList from "./session/list";
import sessionRestore from "./session/restore";
import sessionState from "./session/state";
import toolExecute from "./tool/execute";

export default {
	session: {
		create: createSession,
		state: sessionState,
		cancel: sessionCancel,
		delete: sessionDelete,
		list: sessionList,
		restore: sessionRestore,
	},
	message: {
		send: messageSend,
	},
	tool: {
		execute: toolExecute,
	},
};
