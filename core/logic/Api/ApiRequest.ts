interface ApiRequest {
	headers: { [name: string]: string };
	query: { [name: string]: string | string[] };
	body: any;
}

export default ApiRequest;
