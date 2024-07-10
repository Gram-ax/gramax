import DefaultError from "@ext/errorHandlers/logic/DefaultError";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500mb

function assertMaxFileSize(fileSize: number) {
	const maxSizeMb = MAX_FILE_SIZE / 1024 ** 2;
	if (fileSize > MAX_FILE_SIZE) {
		throw new DefaultError(
			`Размер файла превышает ${maxSizeMb}мб. Сожмите его, выберите файл поменьше или воспользуйтесь десктопной версией.`,
			null,
			null,
			false,
			"Не удалось добавить файл",
		);
	}
}

export default assertMaxFileSize;
