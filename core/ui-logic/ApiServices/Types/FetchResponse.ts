interface FetchResponse<T> extends Response {
	json(): Promise<T>;
}

export default FetchResponse;
