function Features(query, queryStr) {
    const features = {};
  
    features.search = function () {
      const keyword = queryStr.keyword
        ? {
            name: {
              $regex: queryStr.keyword,
              $options: "i",
            },
          }
        : {};
  
      console.log(keyword);
      query = query.find({ ...keyword });
      return features;
    };
  
    features.filter = function () {
      const queryCopy = { ...queryStr };
  
      const removeFields = ["keyword", "page", "limit"];
  
      removeFields.forEach((key) => delete queryCopy[key]);
  
      query = query.find(queryCopy);
      return features;
    };
  
    features.pagination = function (resultPerPage) {
      const currentPage = Number(queryStr.page) || 1;
      const skip = resultPerPage * (currentPage - 1);
  
      query = query.limit(resultPerPage).skip(skip);
  
      return features;
    };
  
    return features;
}
  
module.exports = Features;
  