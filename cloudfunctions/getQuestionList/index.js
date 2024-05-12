// 云函数入口文件
const cloud = require("wx-server-sdk");
const { content } = require("../login/miniprogram_npm/har-validator");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV }); // 初始化数据库
const $ = db.command.aggregate;
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { page = 1, pageSize = 20, classification_id = "0" } = event;

  let query = db
    .collection("question")
    .aggregate()
    .project({
      first_answer: $.arrayElemAt(["$contents", 0]),
      answer_count: $.size("$contents"),
      classification_id:1,
      user_avatar:1,
      user_id:1,
      view_count:1
    })
    .sort({ view_count: -1 });

  if (classification_id != "0") query = query.match({ classification_id });
  const res = await query
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .end();

  console.log(res);

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};
