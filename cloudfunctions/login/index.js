// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init();
const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV });
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  let { data } = await db
    .collection("user")
    .where({
      _openid: wxContext.OPENID,
    })
    .get();

  if (data.length === 0) {
    const user = await db.collection("user").add({
      data: {
        _openid: wxContext.OPENID,
        nickName: "",
        avatarUrl: "",
        unionId: wxContext.UNIONID,
      },
    });
    console.log(user);
  }
  return {
    avatarUrl: data[0]?.avatarUrl,
    nickName: data[0]?.nickName,
    _openid: wxContext.OPENID,
    unionId: wxContext.UNIONID,
  };
};
