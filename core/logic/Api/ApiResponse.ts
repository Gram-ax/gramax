interface ApiResponse {
	statusCode: number;
	headers: { [key: string]: string };
	ok: boolean;
	setHeader: (name: string, value: string) => void;
	redirect: (href: string) => void;
	send: (body: any) => void;
	end: (body?: any) => void;
}

export default ApiResponse;
