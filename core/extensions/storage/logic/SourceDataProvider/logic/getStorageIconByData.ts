import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const STORAGE_GET_ICON: { [type in SourceType]: string } = {
	Git: "git-branch",
	GitLab: "gitlab",
	GitHub: "github",
	GitVerse: "gitverse",
	Gitea: "gitea",
	"Confluence Cloud": "confluence cloud",
	"Confluence self-hosted server": "confluence cloud",
	Notion: "notion",
};

const getStorageIconByData = (data: SourceData): string => {
	return STORAGE_GET_ICON[data.sourceType];
};

export default getStorageIconByData;
