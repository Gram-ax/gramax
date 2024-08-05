import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500mb

function assertMaxFileSize(fileSize: number) {
	const maxSizeMb = MAX_FILE_SIZE / 1024 ** 2;
	if (fileSize > MAX_FILE_SIZE) {
		throw new DefaultError(
			t("article.error.resource-too-large.desc").replace("{{maxSizeMb}}", maxSizeMb),
			null,
			null,
			false,
			t("article.error.resource-too-large.title"),
		);
	}
}

export default assertMaxFileSize;
