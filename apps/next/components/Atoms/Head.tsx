import Head from "next/head";
import type { ReactNode } from "react";

const NextHead = ({ children }: { children: ReactNode }) => {
	return <Head>{children}</Head>;
};

export default NextHead;
