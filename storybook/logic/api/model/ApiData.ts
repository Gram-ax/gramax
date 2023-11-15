import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";

type ApiData = {
	path: string;
	response?: any;
	delay?: number;
	mimeType?: MimeTypes;
	errorMessage?: string;
	errorProps?: { [key: string]: any } & {errorCode?: string};
};

export default ApiData;
