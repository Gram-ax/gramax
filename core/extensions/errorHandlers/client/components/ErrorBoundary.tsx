import PageDataContext from "../../../../logic/Context/PageDataContext";
import BugsnagErrorBoundary from "../../../bugsnag/components/BugsnagErrorBoundary";
import ErrorConfirmService from "../ErrorConfirmService";

const ErrorBoundary = ({ context, children }: { children: JSX.Element; context: PageDataContext }) => {
	if (!context?.conf?.isProduction) return <ErrorConfirmService.Provider>{children}</ErrorConfirmService.Provider>;

	return (
		<BugsnagErrorBoundary context={context}>
			<ErrorConfirmService.Provider>{children}</ErrorConfirmService.Provider>
		</BugsnagErrorBoundary>
	);
};

export default ErrorBoundary;
