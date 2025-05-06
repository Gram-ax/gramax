import {
	GetImageByPathOptions,
	GetImageByPathResult,
	NextImageProccessor,
} from "@ext/markdown/elements/image/export/NextImageProcessor";

const getImageByPath = (options: GetImageByPathOptions): Promise<GetImageByPathResult> => {
	return NextImageProccessor.getImageByPath(options);
};

export default getImageByPath;
