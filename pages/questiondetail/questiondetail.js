Page({
  data: {
    question: "",
    questionId: "",
    contents: [],
    user_avatar: "",
    user_nickname: "",
    view_count: 0,
    discussValue: "",
    showCancel: false,
    userType: 0,
  },
  async onLoad(option) {
    this.setData({ userType: getApp().globalData.userInfo.type });
    const eventChannel = this.getOpenerEventChannel();
    // eventChannel.emit('acceptData', {data: 'test'});
    eventChannel.on("acceptData", async data => {
      // console.log(data);
      this.setData({
        question: data.question,
        questionId: data._id,
        user_avatar: data.user_avatar,
        user_nickname: data.user_nickname
          ? data.user_nickname.substr(0, 1) +
            "*".repeat(data.user_nickname.length - 2) +
            data.user_nickname.substr(-1)
          : "匿名用户",
        view_count: parseInt(data.view_count),
      });
      await this.updateViewCount();
      await this.getContents();
      wx.hideLoading();
    });
    console.log();
  },
  onReady() {
    this.animate(
      ".answer-list",
      [
        { opacity: 0, translateY: 500, ease: "ease-in-out" },
        { opacity: 1, translateY: 0, ease: "ease-in-out" },
      ],
      1000,
      function () {
        this.clearAnimation(".answer-list", { opacity: true, translateY: true });
      }.bind(this)
    );
    this.animate(
      ".question",
      [
        { opacity: 0, translateY: 500, ease: "ease-in-out" },
        { opacity: 1, translateY: 0, ease: "ease-in-out" },
      ],
      1000
    );
    setTimeout(() => {
      this.animate(
        ".tips",
        [
          { opacity: 0, ease: "ease-in-out" },
          { opacity: 1, ease: "ease-in-out" },
        ],
        1000
      );
    }, 1000);
  },
  async updateViewCount() {
    const db = wx.cloud.database();
    const _ = db.command;
    const view_count = parseInt(this.data.view_count) + 1;
    const res = await db
      .collection("question")
      .doc(this.data.questionId)
      .update({
        data: {
          view_count: _.inc(1),
        },
      });
    this.setData({
      view_count: view_count,
    });
    this.getOpenerEventChannel().emit("updateViewCount", {
      questionId: this.data.questionId,
      view_count: view_count,
    });
  },
  async getContents() {
    const db = wx.cloud.database();
    const _ = db.command;
    const { list } = await db
      .collection("question")
      .aggregate()
      .match({
        _id: this.data.questionId,
      })
      .project({
        contents: 1,
      })
      .end();
    this.setData({
      contents: list[0].contents,
    });
  },
  onDiscussFocus(e) {
    console.log();
    this.setData({
      showCancel: true,
    });
  },
  onDiscussInput(e) {
    this.setData({
      discussValue: e.detail.value,
    });
  },
  onCancelTap(e) {
    this.setData({
      discussValue: "",
      showCancel: false,
    });
    wx.hideKeyboard();
  },
  onClearTap(e) {
    this.setData({
      discussValue: "",
    });
  },
  async onDiscussTap(e) {
    if (this.data.discussValue.trim() == "" || !this.data.discussValue) {
      return wx.showToast({
        title: "不能为空",
        icon: "none",
      });
    }
    const db = wx.cloud.database();
    const _ = db.command;

    const res = await db
      .collection("question")
      .doc(this.data.questionId)
      .update({
        data: {
          contents: _.push([this.data.discussValue]),
        },
      });

    if (res.stats.updated == 1) {
      wx.showToast({
        title: "添加成功",
        icon: "success",
      });
      await this.getContents();
      this.getOpenerEventChannel().emit("updateAnswer");
      this.setData({
        discussValue: "",
        showCancel: false,
      });
    }
  },
  async onDelTap(e) {
    const { index } = e.currentTarget.dataset;
    wx.showModal({
      title: "提示",
      content: "确定删除该回答吗？",
      success: async res => {
        if (res.confirm) {
          await this.deleteAnswer(index);
        }
      },
    });
  },
  async deleteAnswer(index) {
    const db = wx.cloud.database();

    // console.log(index);
    // const contents = this.data.contents.filter((item, i) => i != index);
    // console.log(contents);
    // const res = await db
    //   .collection("question")
    //   .doc(this.data.questionId)
    //   .update({
    //     data: {
    //       contents: contents,
    //     },
    //   });

    const _ = db.command;
    const res = await db
      .collection("question")
      .doc(this.data.questionId)
      .update({
        data: {
          contents: _.pull(this.data.contents[index]),
        },
      });

    if (res.stats.updated == 1) {
      wx.showToast({
        title: "删除成功",
        icon: "success",
      });
      this.getOpenerEventChannel().emit("updateAnswer");
      await this.getContents();
    }
  },
});
