import type Url from "@core-ui/ApiServices/Types/Url";

const useUrlImage = (src: Url, deeps?: Array<any>) => {
	return src?.toString();
};

export default useUrlImage;
