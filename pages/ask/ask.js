Page({
  data: {
    userInfo: {},
    avatarUrl:
      "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    categories: [],
    chosenCategory: 0,
    nickname: "",
    checked: false,
  },
  async onLoad(options) {
    let userInfo = null;
    if (!getApp().globalData.userInfo) {
      const { result } = await wx.cloud.callFunction({
        name: "login",
      });
      userInfo = result;
      getApp().globalData.userInfo = userInfo;
    } else {
      userInfo = getApp().globalData.userInfo;
    }

    // console.log(this.data, userInfo);
    this.setData({
      userInfo: userInfo,
      avatarUrl: userInfo.avatarUrl == "" ? this.data.avatarUrl : userInfo.avatarUrl,
      nickname: userInfo.nickName,
    });
    const db = getApp().db;
    const { data } = await db.collection("classification").get();
    this.setData({
      categories: data,
      chosenCategory: data.findIndex(item => item._id == "-1"),
    });
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
        this.clearAnimation(".form", { opacity: true, translateY: true });
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
  bindSaveInfo(e) {
    this.setData({
      checked: e.detail.value.length > 0,
    });
  },
  async submitForm(e) {
    wx.showLoading({
      title: "提交中",
    });
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

    // 将临时图片avatarUrl保存为文件上传到云存储
    let fileUrl = avatarUrl;
    if (
      this.data.checked &&
      avatarUrl !=
        "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0"
    ) {
      console.log(avatarUrl);
      let { fileID } = await wx.cloud.uploadFile({
        cloudPath: `images/avatar/${new Date().getTime()}-${Math.floor(Math.random() * 10000)}.png`,
        filePath: avatarUrl,
        config: {
          env: "dz-q-and-a-4gyin7qna06146b1",
        },
      });
      fileUrl = fileID;
    }

    if (this.data.checked) {
      const db = getApp().db;
      const user = await db
        .collection("user")
        .where({ _openid: this.data.userInfo._openid })
        .update({
          data: {
            avatarUrl: fileUrl,
            nickName: nickname,
          },
        });
      getApp().globalData.userInfo = {
        ...this.data.userInfo,
        avatarUrl: fileUrl,
        nickName: nickname,
      };
    }

    const db = getApp().db;
    const newQuestion = {
      user_id: this.data.userInfo._openid,
      user_avatar: fileUrl,
      user_nickname: nickname,
      classification_id: this.data.categories[category]._id,
      question,
      contents: [],
      view_count: 0,
    };
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
