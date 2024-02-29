import { GitErrorLocalization } from "./model/GitErrorLocalization";

const gitErrorLocalization: GitErrorLocalization = {
	CheckoutConflictError: (props) => {
		if (props?.caller == "pull") {
			if (props?.error?.data?.filepaths) {
				return `Ваши локальные изменения в следующих файлах не позволяют синхронизироваться:\n${
					'"' + props.error.data.filepaths.join('"\n"') + '"'
				}`;
			} else return "Ваши локальные изменения не позволяют синхронизироваться";
		} else {
			if (props?.error?.data?.filepaths) {
				return `Ваши локальные изменения в следующих файлах не позволяют поменять ветку:\n${
					'"' + props.error.data.filepaths.join('"\n"') + '"'
				}`;
			} else return "Ваши локальные изменения не позволяют поменять ветку";
		}
	},
	DeleteCurrentBranch: () => {
		return "Вы пытаетесь удалить ветку, на которой находитесь. Переключите её и попробуйте ещё раз";
	},
	WorkingDirNotEmpty: () => {
		return "У вас есть локальные изменения. Отмените их и попробуйте ещё раз";
	},
	PushRejectedError: (props) => {
		if (props.error?.data?.reason === "not-fast-forward")
			return "У вас устаревшая версия каталога. Синхронизируйте его, затем опубликуйте изменения";
		return `Неизвестная ошибка при публикации. Сообщение ошибки - ${props.error.message}`;
	},
	GitPushError: (props) => {
		if (props.caller === "deleteBranch") {
			if (props.error.props.fromMerge) {
				const branch = props.error.props.branchName;
				return `Ветка ${branch} защищена от удаления. Снимите флаг с пункта "Удалить ветку ${branch} после объединения" и попробуйте еще раз.`;
			}
			return `Не удалось удалить удалённую ветку ${props.error.props.branchName}`;
		}
		return `Ветка защищена от публикации`;
	},
	CurrentBranchNotFoundError: () => {
		return "Не удалось определить текущую ветку";
	},
	RemoteNotFoundMessageError: (props) => {
		return `Не удалось найти удалённую ветку для локальной ветки ${props.error?.props?.branchName}`;
	},
	MergeNotSupportedError: () => {
		return `Ошибка при слиянии. Мы пока не умеем решать такие конфликты`;
	},
	MergeConflictError: (props) => {
		if (props?.error?.data?.filepaths)
			return `Не удалось автоматически решить конфликт слияния в следующих файлах: ${
				'"' + props?.error?.data?.filepaths.join('"\n"') + '"'
			}`;

		return "Не удалось автоматически решить конфликт слияния";
	},
	MergeError: () => {
		return `Не удалось слить ветки`;
	},
	AlreadyExistsError: (props) => {
		if (props.caller === "branch") {
			return `Не удалось создать новую ветку. Ветка "${props.error?.props?.branchName}" уже существует`;
		} else if (props.caller === "clone")
			return `Каталог с таким названием уже существует (${props.error?.props?.repositoryPath})`;
	},
	HttpError: (props) => {
		if (props.caller === "pull") {
			if (props.error.data.statusCode === "401") return `У вас нет прав для синхронизации с этим каталогом`;
		}
		return `Ошибка HTTP${props.error.data.statusCode ? `, код ошибки: ${props.error.data.statusCode}` : ""}`;
	},
	NotFoundError: (props) => {
		if (props.caller === "resolveRef") {
			return `Не удалось найти ветку ${props.error.props.branchName}`;
		} else if (props.caller === "pull") {
			return `Не удалось найти удалённую ветку "${props.error.data.what}"`;
		} else if (props.caller === "checkout") {
			return `Не удалось найти ветку ${props.error.data.what}`;
		} else if (props.caller === "branch") {
			return `Не удалось найти ветку ${props.error.props.what}`;
		} else if (props.caller === "readBlob") {
			return `Не удалось найти файл ${props.error.props.filePath} в ${
				props.error.props.hash ? `коммите ${props.error.props.hash}` : "последнем коммите"
			}`;
		} else {
			return `Код ошибки - NotFoundError. Сообщение ошибки - ${props.error.message}`;
		}
	},
};

export default gitErrorLocalization;
