import { useRouter } from "@core/Api/useRouter";

const useRemoveQueryT = (isFirstLoad: boolean) => {
	const router = useRouter();
	if (!isFirstLoad) return;
	if (typeof document !== "undefined" && router?.query?.t) {
		delete router.query.t;
		router.pushQuery(router.query);
	}
};

export default useRemoveQueryT;
