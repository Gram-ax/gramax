interface ApiResponse {
	statusCode: number;
	headers: { [key: string]: string };
	ok: boolean;
	setHeader: (name: string, value: string) => void;
	redirect: (href: string) => void;
	arrayBuffer: () => Promise<Uint8Array>;
	send: (body: any) => void;
	end: (body?: any) => void;
}

export default ApiResponse;
