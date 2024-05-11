Page({
  data: {
    userInfo: {},
    avatarUrl:
      "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    categories: [],
    chosenCategory: 0,
    nickname: "",
  },
  async onLoad(options) {
    const { result: userinfo } = await wx.cloud.callFunction({
      name: "login",
    });
    console.log(userinfo);
    this.setData({
      userInfo: userinfo,
      avatarUrl: userinfo.avatarUrl == "" ? this.data.avatarUrl : userinfo.avatarUrl,
      nickname: userinfo.nickName,
    });
    const db = getApp().db;
    const { data } = await db.collection("classification").get();
    this.setData({
      categories: data,
      chosenCategory: data.findIndex(item => item._id == "0"),
    });
    // if(userinfo.avatatUrl == '' || userinfo.nickName == ''){
    //   wx.showModal({
    //     title: '提示',
    //     content: '是否保存头像和昵称',
    //     complete: (res) => {
    //       if (res.cancel) {

    //       }

    //       if (res.confirm) {
    //         wx.redirectTo({
    //           url: '/pages/login/login'
    //         })
    //       }
    //     }
    //   })
    // }
  },
  onReady() {
    this.animate(
      ".form",
      [
        { opacity: 0, translateY: 500, ease: "ease-in-out" },
        { opacity: 1, translateY: 0, ease: "ease-in-out" },
      ],
      1000,
      function () {
        this.clearAnimation(".container", { opacity: true, translateY: true });
      }.bind(this)
    );
  },
  onShow() {},
  onHide() {},
  onUnload() {},
  onShareAppMessage() {
    return {
      title: "",
    };
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
    });
  },
  bindNickname(e) {
    this.setData({
      nickname: e.detail.value,
    });
  },
  bindPickerChange: function (e) {
    this.setData({
      chosenCategory: e.detail.value,
    });
  },
  submitForm(e) {
    console.log(e);
    const { avatarUrl } = this.data;
    let { nickname, category, question } = e.detail.value;

    if (question.trim() == "") {
      return wx.showToast({
        title: "请输入问题内容",
        icon: "none",
        duration: 2000,
      });
    }

    if (nickname.trim() == "") {
      nickname = "匿名用户";
    }

    if (
      (avatarUrl !=
        "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0" ||
        nickname != "匿名用户") &&
      (this.data.userInfo.nickName == "" || this.data.userInfo.avatarUrl == "")
    ) {
      wx.showModal({
        title: "提示",
        content: "是否保存头像和昵称",
        complete: res => {

        },
      });
    }

    const db = getApp().db;
    const newQuestion = {
      user_id: this.data.userInfo._openid,
      user_avatar: avatarUrl,
      user_nickname: nickname,
      classification_id: this.data.categories[category]._id,
      question,
      contents: [],
      view_count: 0,
    };
    console.log(newQuestion);
    db.collection("question")
      .add({
        data: newQuestion,
      })
      .then(res => {
        wx.showToast({
          title: "提交成功",
          icon: "success",
          duration: 2000,
        });
        setTimeout(() => {
          wx.redirectTo({
            url: "/pages/myquestion/myquestion",
          });
        }, 1500);
      })
      .catch(err => {
        console.error(err);
        wx.showToast({
          title: "提交失败",
          icon: "none",
          duration: 2000,
        });
      });
  },
});
