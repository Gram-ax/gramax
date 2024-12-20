import importSourceTypes from "@ext/storage/logic/SourceDataProvider/logic/importSourceType";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const excludeSourcesFilter = (excludedSources) => (source) => !excludedSources.includes(source);

const sharedConfig = {
	placeholderSuffix: t("storage2"),
	legendLabel: t("add-new-storage"),
	controlLabel: t("storage"),
};

const getSourceConfig = (mode) => {
	const environment = getExecutingEnvironment();

	const modeConfigs = {
		import: {
			placeholderSuffix: t("source2").toLowerCase(),
			legendLabel: t("add-new-source"),
			controlLabel: t("source"),
			filter: (source) =>
				source === SourceType.confluenceCloud ||
				source === SourceType.notion ||
				source === SourceType.yandexDisk ||
				(environment === "tauri" && source === SourceType.confluenceServer),
		},
		clone: {
			...sharedConfig,
			filter: excludeSourcesFilter(importSourceTypes),
		},
		init: {
			...sharedConfig,
			filter: excludeSourcesFilter([...importSourceTypes, SourceType.git]),
		},
	};

	return modeConfigs[mode];
};

export default getSourceConfig;
