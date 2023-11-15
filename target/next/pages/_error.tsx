import Error from "@components/Error";
import Err from "next/error";

const isStable = process.env.STABLE || false;

function error({ statusCode, message, stack }: { statusCode: number; message: string; stack: string }) {
	return isStable ? (
		<Err statusCode={statusCode} />
	) : (
		// <p>{statusCode ? `An error ${statusCode} occurred on server: ${message}` : `An error occurred on client: ${message}`}</p>
		<Error error={{ stack, message }} isLogged={true} />
	);
}

error.getInitialProps = ({ res, err }: any) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	const stack = err ? err.stack : "";
	const message = err ? err.message : "";
	return { statusCode, message, stack };
};

export default error;
