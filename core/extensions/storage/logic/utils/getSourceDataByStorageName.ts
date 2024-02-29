import PageDataContext from "@core/Context/PageDataContext";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";

const getSourceDataByStorageName = (storageName: string, pageProps: PageDataContext): SourceData => {
	if (pageProps.sourceDatas.length === 0) return null;
	for (const sourceData of pageProps.sourceDatas) {
		if (getStorageNameByData(sourceData) == storageName) return sourceData;
	}
};

export default getSourceDataByStorageName;
