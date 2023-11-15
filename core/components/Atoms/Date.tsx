import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import DateUtils from "@core-ui/utils/dateUtils";
import Tooltip from "./Tooltip";

const Date = ({ date, className }: { date: string; className?: string }) => {
	const lang = PageDataContextService.value.lang;
	const relativeDate = DateUtils.getRelativeDateTime(date, lang);
	const dateViewModel = DateUtils.getDateViewModel(date, lang);
	return (
		<Tooltip content={dateViewModel}>
			<span className={className}>{relativeDate}</span>
		</Tooltip>
	);
};

export default Date;
