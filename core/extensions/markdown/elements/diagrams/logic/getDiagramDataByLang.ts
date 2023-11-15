const getDiagramDataByLang = (lang: string) => {
	const [name, title] = lang ? lang.split(":") : [];
	return { name, title };
};

export default getDiagramDataByLang;
