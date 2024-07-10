type Article = {
	id: string;
	title: string;
	link: string;
};

type UnsupportedElement = {
	name: string;
	count: number;
};

type UnsupportedElements = {
	article: Article;
	elements: UnsupportedElement[];
};

export default UnsupportedElements;
