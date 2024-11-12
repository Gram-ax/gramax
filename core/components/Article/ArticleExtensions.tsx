import IsEditService from "@core-ui/ContextServices/IsEdit";
import styled from "@emotion/styled";

const ArticleExtensions = ({ className, id }: { id: string; className?: string }) => {
	const isEdit = IsEditService.value;

	return <div className={className}>{isEdit && <div id={id} />}</div>;
};

export default styled(ArticleExtensions)`
	bottom: 4px;
	z-index: var(--z-index-base);
	position: sticky;
`;
