import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";

const getSourceDataByStorageName = (storageName: string, sourceDatas: SourceData[]): SourceData => {
	if (sourceDatas.length === 0) return null;
	for (const sourceData of sourceDatas) {
		if (getStorageNameByData(sourceData) == storageName) return sourceData;
	}
};

export default getSourceDataByStorageName;
