const getTotalPages = (link: string): number => {
	if (!link) return 1;
	const last = link.split(",").filter((x) => x.endsWith(`rel="last"`))[0];
	if (!last) {
		return (
			Number(
				new URLSearchParams(
					link
						.split(",")
						.filter((x) => x.endsWith(`rel="prev"`))[0]
						.split(";")[0]
						.match(/<(.*?)>/)[1],
				).get("page"),
			) + 1
		);
	}

	return Number(
		new URLSearchParams(
			link
				.split(",")
				.filter((x) => x.endsWith(`rel="last"`))[0]
				.split(";")[0]
				.match(/<(.*?)>/)[1],
		).get("page"),
	);
};

export default getTotalPages;
