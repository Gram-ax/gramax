type Article = {
	id: string;
	title: string;
	link: string;
};

export type UnsupportedElement = {
	name: string;
	count: number;
};

export type UnsupportedElements = {
	article: Article;
	elements: UnsupportedElement[];
};
