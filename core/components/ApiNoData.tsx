import SpinnerLoader from "./Atoms/SpinnerLoader";
import Error from "./Error";

const ApiNoData = ({ error }: { error: Error }) =>
	error ? (
		<Error
			error={{
				message: error.message,
				stack: error.stack,
			}}
			isLogged={true}
		/>
	) : (
		<SpinnerLoader fullScreen />
	);

export default ApiNoData;
