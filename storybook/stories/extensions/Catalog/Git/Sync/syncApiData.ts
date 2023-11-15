import ApiData from "../../../../../logic/api/model/ApiData";

const syncApiData: ApiData[] = [
	{
		path: "/api/storage/pull",
		delay: 1000,
		errorMessage: "pull error",
	},
];

export default syncApiData;
