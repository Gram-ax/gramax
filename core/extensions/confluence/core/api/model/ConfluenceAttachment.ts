interface ConfluenceAttachment {
	id: string;
	title: string;
	mediaType: string;
	fileSize: number;
	fileId?: string;
	downloadLink?: string;
	webui?: string;
}

export interface ConfluenceAttachmentResponse {
	results: ConfluenceAttachment[];
	_links: {
		next?: string;
	};
}

export default ConfluenceAttachment;
