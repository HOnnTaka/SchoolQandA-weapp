Page({
  data: {
    userInfo: {},
    avatarUrl:
      "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
    categories: [],
    chosenCategory: 0,
    nickname: "",
    checked: false,
    editInfo: {},
    question: "",
  },
  async onLoad(options) {
    const userInfo = getApp().globalData.userInfo;

    this.setData({
      editInfo: options,
      userInfo: userInfo,
    });
    if (options.type == "edit") {
      wx.setNavigationBarTitle({
        title: "编辑问题",
      });
    }

    const db = getApp().db;
    const { data } = await db.collection("classification").get();
    data.unshift({ _id: "-1", classification: "未分类" });
    console.log(data);
    this.setData({
      categories: data,
      chosenCategory: data.findIndex(item => item._id == "-1"),
    });

    this.getOpenerEventChannel().on("acceptData", data => {
      console.log(data);
      if (this.data.editInfo.type == "edit") {
        this.setData({
          avatarUrl: data.user_avatar,
          nickname: data.user_nickname ? data.user_nickname : "匿名用户",
          question: data.question,
          chosenCategory: this.data.categories.findIndex(
            item => item._id == (data.classification_id ? data.classification_id : "-1")
          ),
        });
        wx.hideLoading();
      }
    });

    if (options.type != "edit") {
      // console.log(this.data, userInfo);
      this.setData({
        avatarUrl: userInfo.avatarUrl == "" ? this.data.avatarUrl : userInfo.avatarUrl,
        nickname: userInfo.nickName,
      });
    }
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
  bindPickerChange(e) {
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
    if (this.data.editInfo.type == "edit") {
      await this.updateInfo(e);
    } else {
      await this.saveInfo(e);
    }
  },
  async updateInfo(e) {
    console.log("edit");
    const { question, category } = e.detail.value;
    if (question.trim() == "") {
      return wx.showToast({
        title: "请输入问题内容",
        icon: "none",
        duration: 2000,
      });
    }
    const db = getApp().db;
    const res = await db
      .collection("question")
      .doc(this.data.editInfo.questionId)
      .update({
        data: {
          question,
          classification_id:
            this.data.categories[category]._id == "-1" ? null : this.data.categories[category]._id,
        },
      });
    if (res.stats.updated == 1) {
      wx.showToast({
        title: "修改成功",
        icon: "success",
        duration: 2000,
      });
      // 传回主页 分类能保留 id：-1
      this.getOpenerEventChannel().emit("updateQuestion", {
        question,
        classification_id: this.data.categories[this.data.chosenCategory]._id,
        questionId: this.data.editInfo.questionId,
      });
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
        });
      }, 1500);
    } else {
      wx.showToast({
        title: "修改失败",
        icon: "none",
        duration: 2000,
      });
    }
  },
  async saveInfo(e) {
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
      const res = await db
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
      classification_id:
        this.data.categories[category]._id == "-1" ? null : this.data.categories[category]._id,
      question,
      contents: [],
      view_count: 0,
    };
    db.collection("question")
      .add({
        data: newQuestion,
      })
      .then(res => {
        this.getOpenerEventChannel().emit("clearStorage");
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
