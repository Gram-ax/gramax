import parseStorageUrl from "@core/utils/parseStorageUrl";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import type ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import type ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import type ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import type GiteaSourceData from "@ext/git/actions/Source/Gitea/logic/GiteaSourceData";
import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import type GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type { ImportModalFormSchema } from "@ext/import/model/ImportModalFormSchema";
import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import type { SelectFormSchemaType } from "@ext/storage/logic/SourceDataProvider/model/SelectSourceFormSchema";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type StorageData from "@ext/storage/models/StorageData";

const TYPES_GETTERS: Record<
	Partial<SourceType>,
	(sourceData: SourceData, data: unknown) => StorageData | ConfluenceStorageData
> = {
	[SourceType.gitHub]: (sourceData: GitHubSourceData, data: SelectFormSchemaType) => {
		const urlWithDomain = `${sourceData.protocol}://${sourceData.domain}/${
			data.repository?.path || data.user?.name
		}`;
		const { group, name } = parseStorageUrl(urlWithDomain);

		return {
			source: sourceData,
			name: name,
			group: group,
			type: data.user?.type,
		};
	},
	[SourceType.gitLab]: (sourceData: GitlabSourceData, data: SelectFormSchemaType) => {
		const urlWithDomain = `${sourceData.protocol}://${sourceData.domain}/${data.repository?.path}`;
		const { group, name } = parseStorageUrl(urlWithDomain);

		return {
			source: sourceData,
			name: name,
			group: group,
		};
	},
	[SourceType.gitVerse]: (sourceData: GitVerseSourceData, data: SelectFormSchemaType) => {
		const urlWithDomain = `${sourceData.protocol}://${sourceData.domain}/${
			data.repository?.path || data.user?.name
		}`;
		const { group, name } = parseStorageUrl(urlWithDomain);

		return {
			source: sourceData,
			name: name,
			group: group,
		};
	},
	[SourceType.gitea]: (sourceData: GiteaSourceData, data: SelectFormSchemaType) => {
		const urlWithDomain = `${sourceData.protocol}://${sourceData.domain}/${
			data.repository?.path || data.user?.name
		}`;
		const { group, name } = parseStorageUrl(urlWithDomain);

		return {
			source: sourceData,
			name: name,
			group: group,
		};
	},
	[SourceType.confluenceCloud]: (sourceData: ConfluenceCloudSourceData, data: ImportModalFormSchema) => {
		return {
			source: sourceData,
			id: data.space.value,
			name: transliterate(data.space.displayName, { kebab: true, maxLength: 50 }),
			displayName: data.space.displayName,
		};
	},
	[SourceType.confluenceServer]: (sourceData: ConfluenceServerSourceData, data: ImportModalFormSchema) => {
		return {
			source: sourceData,
			id: data.space.value,
			name: transliterate(data.space.displayName, { kebab: true, maxLength: 50 }),
			displayName: data.space.displayName,
		};
	},
	[SourceType.notion]: (sourceData: NotionSourceData) => {
		return {
			source: sourceData,
			name: transliterate(sourceData.workspaceName, {
				kebab: true,
				maxLength: 50,
			}),
		};
	},
	[SourceType.git]: (sourceData: GitSourceData, data: SelectFormSchemaType) => {
		if (!sourceData.protocol) sourceData.protocol = "https";
		const { group, name, protocol } = parseStorageUrl(data.repository?.path);

		if (protocol !== sourceData.protocol) return null;

		return {
			source: sourceData,
			name: name,
			group: group,
		};
	},
};

export const getStorageDataByForm = (sourceData: SourceData, data: unknown) => {
	const getter = TYPES_GETTERS[sourceData.sourceType];
	if (!getter) return null;
	return getter(sourceData, data);
};
