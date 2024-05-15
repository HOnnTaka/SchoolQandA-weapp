const cloud = require("wx-server-sdk");
cloud.init();
const db = cloud.database({
  env: "dz-q-and-a-4gyin7qna06146b1"
});
const $ = db.command.aggregate;
exports.main = async (event, context) => {
  const keyword = event.keyword;
  if (keyword == null || keyword.trim() == "") {
    return []
  }
  try {
    const res = await db
      .collection("question")
      .aggregate()
      .match({
        question: db.RegExp({
          regexp: keyword,
          options: "i"
        }),
      })
      .project({
        question: 1,
        first_answer: $.arrayElemAt(["$contents", 0]),
        answer_count: $.size("$contents"),
        classification_id: 1,
        user_avatar: 1,
        user_nickname: 1,
        user_id: 1,
        view_count: 1,
      })
      .sort({
        view_count: -1
      })
      .end();

    return res.list;
  } catch (err) {
    console.error(err);
    return err;
  }
};