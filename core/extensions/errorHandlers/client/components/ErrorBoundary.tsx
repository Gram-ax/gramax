import PageDataContext from "../../../../logic/Context/PageDataContext";
import BugsnagErrorBoundary from "../../../bugsnag/components/BugsnagErrorBoundary";
import ErrorConfirmService from "../ErrorConfirmService";

export type ErrorBoundaryProps = { context?: PageDataContext; children: JSX.Element };

const ErrorBoundary = ({ context, children }: ErrorBoundaryProps) => {
	if (!context?.conf?.isProduction) return <ErrorConfirmService.Provider>{children}</ErrorConfirmService.Provider>;

	return (
		<BugsnagErrorBoundary context={context}>
			<ErrorConfirmService.Provider>{children}</ErrorConfirmService.Provider>
		</BugsnagErrorBoundary>
	);
};

export default ErrorBoundary;
