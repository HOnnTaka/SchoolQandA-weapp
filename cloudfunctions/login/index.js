// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init();
const db = cloud.database({ env: cloud.DYNAMIC_CURRENT_ENV });
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  console.log(event, event.nickName != null && event.avatarUrl != null);
  if (event.nickName != null && event.avatarUrl != null) {
    // 注册
    await db.collection("user").add({
      data: {
        _openid: wxContext.OPENID,
        nickName: event.nickName,
        avatarUrl: event.avatarUrl,
        userType: 0,
      },
    });
    console.log(wxContext);
    return {
      event,
      avatarUrl: event.avatarUrl,
      nickName: event.nickName,
      _openid: wxContext.OPENID,
      unionId: wxContext.UNIONID,
    };
  } else {
    const { data } = await db
      .collection("user")
      .where({
        _openid: wxContext.OPENID,
      })
      .get();
    return {
      avatarUrl: data[0].avatarUrl,
      nickName: data[0].nickName,
      _openid: wxContext.OPENID,
      unionId: wxContext.UNIONID,
    };
  }
};
