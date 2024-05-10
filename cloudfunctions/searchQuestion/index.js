const cloud = require("wx-server-sdk");
cloud.init();
const db = cloud.database({env:"dz-q-and-a-4gyin7qna06146b1"});

exports.main = async (event, context) => {
  const keyword = event.keyword;
  try {
    const res = await db
      .collection("question")
      .where(
        {
          question: db.RegExp({ regexp: keyword, options: "i" })
        }
      )
      .get();

    return res.data;
  } catch (err) {
    console.error(err);
    return err;
  }
};
