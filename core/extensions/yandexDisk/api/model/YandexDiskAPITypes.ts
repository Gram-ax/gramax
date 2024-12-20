export interface YandexDiskFile {
	name: string;
	path: string;
	type: string;
	created: string;
	modified: string;
	mime_type?: string;
	preview?: string;
	file?: string;
	items?: YandexDiskFile[];
}

export interface YandexDiskApiResponse {
	_embedded: {
		items: YandexDiskFile[];
	};
}
