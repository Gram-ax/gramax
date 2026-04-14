const fileResponse = (file: Bun.BunFile) =>
	new Response(file, {
		headers: { "Content-Type": file.type ?? "application/octet-stream" },
	});

export default fileResponse;
