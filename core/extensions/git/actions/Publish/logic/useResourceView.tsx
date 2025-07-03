import ExactResourceView from "@ext/git/actions/Publish/logic/ExactResourceView";
import { UseResourceArticleViewType } from "@ext/git/actions/Publish/logic/ExactResourceViewWithContent";

interface UseResourceViewType extends Omit<UseResourceArticleViewType, "type"> {}

export const useResourceView = (props: UseResourceViewType) => {
	return <ExactResourceView {...props} key={props.resourcePath.value} />;
};
