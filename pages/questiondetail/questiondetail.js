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
  },
  async onLoad(option) {
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
        { opacity: 0, ease: "ease-in-out" },
        { opacity: 1, ease: "ease-in-out" },
      ],
      1000,
      function () {
        this.clearAnimation(".question", { opacity: true });
      }.bind(this)
    );
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
    // 新评论进入动画
    this.animate(
      ".item",
      [
        { opacity: 0, translateY: 0, ease: "ease-in-out" },
        { opacity: 1, translateY: 0, ease: "ease-in-out" },
      ],
      300
    );
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
    console.log(this.data.discussValue);
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
  async onDiscussTap(e) {},
});
