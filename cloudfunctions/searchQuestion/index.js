const cloud = require("wx-server-sdk");
cloud.init();
const jieba = require("@node-rs/jieba");
const db = cloud.database({
  env: "dz-q-and-a-4gyin7qna06146b1",
});
const $ = db.command.aggregate;
const _ = db.command;
exports.main = async (event, context) => {
  const { keyword: text, userInfo } = event;

  if (text == null || text.trim() == "") {
    return [];
  }
  const result = jieba.extract(text, 2);
  result.sort((a, b) => b.weight - a.weight);
  console.log(result);
  const keywords = result.map(item => item.keyword);
  console.log(keywords);
  try {
    const res1 = await db
      .collection("question")
      .aggregate()
      .match({
        question: db.RegExp({
          regexp: `.*${text}.*`,
          options: "i",
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
      .end();
    const res = await db
      .collection("question")
      .aggregate()
      .match(
        // 数组contents[0]中包含关键词或者字段question包含关键词，模糊查询
        _.or([
          {
            question: db.RegExp({
              regexp: `.*${text}.*`,
              options: "i",
            }),
          },
          {
            question: db.RegExp({
              regexp: `.*${keywords.join("|")}.*`,
              options: "i",
            }),
          },
          {
            "contents[0]": db.RegExp({
              regexp: `.*${keywords.join("|")}.*`,
              options: "i",
            }),
          },
        ])
      )
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
      .end();

    // 对查询结果进行权重排序,含result对象中的weight属性
    const sortedResult = res.list.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        if (a.question.includes(keyword)) {
          scoreA += result[i].weight;
        }
        if (b.question.includes(keyword)) {
          scoreB += result[i].weight;
        }
        if (a.first_answer.includes(keyword)) {
          scoreA += result[i].weight;
        }
        if (b.first_answer.includes(keyword)) {
          scoreB += result[i].weight;
        }
      }
      return scoreB - scoreA;
    });
    const finalResult = res1.list.concat(sortedResult);
    if (finalResult.length <= 5) {
      const addRes = await db.collection("question").add({
        data: {
          user_id: userInfo._openid,
          user_avatar: userInfo.avatarUrl,
          user_nickname: userInfo.nickname,
          classification_id: null,
          question: text,
          contents: [],
          view_count: 0,
        },
      });
      console.log(addRes);
    }
    return finalResult;
  } catch (err) {
    console.error(err);
    return err;
  }
};
