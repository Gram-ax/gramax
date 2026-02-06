import Header, { HeaderProps } from "@ext/markdown/elements/heading/render/components/Header";

const ArticleContentHeader = (props: HeaderProps) => {
	const { level, ...other } = props;
	const newLevel = level === 1 ? 2 : level;
	return <Header {...other} level={newLevel} />;
};

export default ArticleContentHeader;
