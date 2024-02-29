const getTotalPages = (link: string): number =>
	link
		? Number(
				new URLSearchParams(
					link
						.split(",")
						.filter((x) => x.endsWith(`rel="last"`))[0]
						.split(";")[0]
						.match(/<(.*?)>/)[1],
				).get("page"),
		  )
		: 1;

export default getTotalPages;
