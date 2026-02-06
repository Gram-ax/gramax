import resolveModule from "@app/resolveModule/frontend";

const openChat = async () => {
	const uri = `https://t.me/gramax_chat`;
	const child = await resolveModule("openChildWindow")({ url: encodeURI(uri), name: "_blank" });
	child.focus();
};

export default openChat;
