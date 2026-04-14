import ContextProviders from "@components/ContextProviders";
import type { PageProps } from "@components/Pages/models/Pages";
import AdminLoginLayout from "@ext/admin/AdminLayout";

export function Admin({ data }: { data: PageProps }) {
	return (
		<ContextProviders pageProps={data} platform="docportal" refreshPage={() => {}}>
			<AdminLoginLayout />
		</ContextProviders>
	);
}
