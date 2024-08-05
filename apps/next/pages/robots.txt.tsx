import fs from "fs";
import { GetServerSideProps } from "next";
import Error from "next/error";
import path from "path";

const Robots = ({ notFound }: { notFound: boolean }) => {
	if (notFound) return <Error statusCode={404} />;

	return null;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
	const filePath = path.join(process.cwd(), "../../public", "robots.txt");

	if (!fs.existsSync(filePath)) {
		res.statusCode = 404;
		return {
			props: { notFound: true },
		};
	}

	const sitemap = fs.readFileSync(filePath, "utf8");

	res.setHeader("Content-Type", "text/plain");
	res.write(sitemap);
	res.end();

	return {
		props: { notFound: false },
	};
};

export default Robots;
