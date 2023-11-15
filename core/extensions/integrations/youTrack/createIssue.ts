import resolveModule, { getExecutingEnvironment } from "@app/resolveModule";

const createIssue = async (version: string, hash?: string) => {
	const uri = `https://support.ics-it.ru/newIssue?project=DRS&description=
  

  ---
Информация о пользователе:
- Версия: \`${version}\`
- Платформа: \`${getExecutingEnvironment()}\` 
- UserAgent: \`${window.navigator.userAgent}\`
${
	hash
		? `- [Bugsnag](https://app.bugsnag.com/intellektualnye-korporativnye-resheniya/gramax-client/errors/64f19a7abcabe50008f67bb0?filters[metaData.hash.hash]=${hash}): \`${hash}\``
		: ``
}`;

	const child = await resolveModule("openChildWindow")({ url: encodeURI(uri), name: "_blank" });
	child.focus();
};

export default createIssue;
