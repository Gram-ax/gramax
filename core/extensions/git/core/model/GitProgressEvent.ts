interface GitProgressEvent {
	phase: string;
	loaded: number;
	total: number;
}

export default GitProgressEvent;
