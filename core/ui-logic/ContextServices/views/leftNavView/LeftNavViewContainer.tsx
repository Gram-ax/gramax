import LeftNavViewContentService, {
	LeftNavViewContentComponent,
} from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";

const LeftNavViewContentContainer: LeftNavViewContentComponent = ({ itemLinks, closeNavigation }): JSX.Element => {
	const LeftNavViewContentValue = LeftNavViewContentService.value;
	if (!LeftNavViewContentValue) return null;
	return <LeftNavViewContentValue itemLinks={itemLinks} closeNavigation={closeNavigation} />;
};

export default LeftNavViewContentContainer;
