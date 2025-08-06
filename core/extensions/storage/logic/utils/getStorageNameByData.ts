import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import ShareData from "../../../catalog/actions/share/model/ShareData";
import GitShareData from "../../../git/core/model/GitShareData";
import GitSourceData from "../../../git/core/model/GitSourceData.schema";
import SourceData from "../SourceDataProvider/model/SourceData";

const STORAGE_GET_NAME: { [type in SourceType]: (data: SourceData | ShareData) => string } = {
	Git: (data) => parseStorageUrl(`${(data as GitSourceData | GitShareData).domain}`).domain,

	GitLab: (data) => `${(data as GitSourceData | GitShareData).domain}`,
	GitHub: (data) => `${(data as GitSourceData | GitShareData).domain}`,
	GitVerse: (data) => `${(data as GitSourceData | GitShareData).domain}`,

	"Confluence self-hosted server": (data) => parseStorageUrl(`${(data as ConfluenceSourceData).domain}`).domain,
	"Confluence Cloud": (data) => parseStorageUrl(`${(data as ConfluenceSourceData).domain}`).domain,

	Notion: (data) => `${(data as NotionSourceData).workspaceName}`,
};

const getStorageNameByData = (data: SourceData | ShareData): string => {
	if (!data) return "";
	return STORAGE_GET_NAME[data.sourceType](data);
};

export default getStorageNameByData;
