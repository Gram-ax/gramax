import { classNames } from "@components/libs/classNames";

export const ArticleParent = ({ children }: { children: React.ReactNode }) => {
	return <div className={classNames("article-body")}>{children}</div>;
};
