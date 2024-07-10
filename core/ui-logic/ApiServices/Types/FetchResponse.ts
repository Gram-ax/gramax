interface FetchResponse<T = any> extends Response {
	json(): Promise<T>;
	buffer(): Promise<Buffer>;
}

export default FetchResponse;
