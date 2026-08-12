import browserClick from "./browser/click";
import browserNavigate from "./browser/navigate";
import browserReadElement from "./browser/readElement";
import browserReadPage from "./browser/readPage";
import browserReveal from "./browser/reveal";
import browserScroll from "./browser/scroll";
import browserSetAllowed from "./browser/setBrowserAllowed";
import browserType from "./browser/type";
import messageSend from "./message/send";
import sessionCancel from "./session/cancel";
import sessionContext from "./session/context";
import createSession from "./session/create";
import sessionDelete from "./session/delete";
import sessionDraft from "./session/draft";
import sessionList from "./session/list";
import sessionRestore from "./session/restore";
import sessionSaveDraft from "./session/saveDraft";
import sessionState from "./session/state";
import skillsList from "./skills/list";

export default {
	session: {
		create: createSession,
		state: sessionState,
		context: sessionContext,
		cancel: sessionCancel,
		delete: sessionDelete,
		list: sessionList,
		restore: sessionRestore,
		draft: sessionDraft,
		saveDraft: sessionSaveDraft,
	},
	browser: {
		navigate: browserNavigate,
		readPage: browserReadPage,
		readElement: browserReadElement,
		click: browserClick,
		type: browserType,
		scroll: browserScroll,
		reveal: browserReveal,
		setAllowed: browserSetAllowed,
	},
	message: {
		send: messageSend,
	},
	skills: {
		list: skillsList,
	},
};
