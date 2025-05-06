import type GitShareData from "@ext/git/core/model/GitShareData";

const getUrlFromShareData = (shareData: GitShareData) => {
  return `${shareData.domain}/${shareData.group}/${shareData.name}`;
};

export default getUrlFromShareData;
