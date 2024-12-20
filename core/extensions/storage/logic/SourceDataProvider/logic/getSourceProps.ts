import SourceType from "../model/SourceType";

const getSourceProps = (sourceType: SourceType, defaultSourceData: any) => {
	const baseProps = {
		sourceType,
		domain: "",
		protocol: "",
		token: "",
		userName: null,
		userEmail: null,
		...defaultSourceData,
	};

    const propsMap: Record<string, () => any> = {
        [SourceType.git]: () => ({
            props: baseProps,
            readOnlyProps: defaultSourceData,
        }),
        [SourceType.gitLab]: () => ({
            props: baseProps,
            readOnlyProps: defaultSourceData,
        }),
        [SourceType.confluenceServer]: () => ({
            props: {
                ...baseProps,
                domain: null,
                token: null,
                userName: "empty",
                userEmail: "empty",
            },
            readOnlyProps: defaultSourceData,
        }),
    };

    return propsMap[sourceType]?.();
};

export default getSourceProps;
