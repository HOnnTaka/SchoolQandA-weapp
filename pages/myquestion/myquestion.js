Page({
  data: {
    questions: "",
    userType: 0,
  },
  async onLoad(options) {
    this.setData({ userType: getApp().globalData.userInfo.type });
    await this.getMyquestion();
    wx.hideLoading();
  },
  onReady() {
    this.animate(
      ".container",
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
  async getMyquestion(e) {
    const db = getApp().db;
    const $ = db.command.aggregate;
    const result = await db
      .collection("question")
      .aggregate()
      .match({
        user_id: getApp().globalData.userInfo._openid,
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
      .sort({ view_count: -1 })
      .end();

    this.setData({
      questions: result.list,
    });
  },
  async onMoreAnswersTap(e) {
    const page = this;
    wx.showLoading({
      title: "加载中",
    });
    wx.navigateTo({
      url: "/pages/questiondetail/questiondetail",
      events: {
        updateViewCount: data => {
          this.setData({
            questions: this.data.questions.map(item => {
              if (item._id == data.questionId) {
                item.view_count = data.view_count;
              }
              return item;
            }),
          });
          getApp().storage[`${this.data.classificationSelectedId}#${this.data.page}`] = this.data.questions;
        },
        updateAnswer: data => {
          this.setData({
            questions: this.data.questions.map(item => {
              if (item._id == data.questionId) {
                item.answer_count = data.answer_count;
                if (!item.first_answer) {
                  item.first_answer = data.content;
                }
              }
              return item;
            }),
          });
          getApp().storage[`${this.data.classificationSelectedId}#${this.data.page}`] = this.data.questions;
        },
      },
      success: function (res) {
        res.eventChannel.emit("acceptData", e.currentTarget.dataset.data);
      },
    });
  },
});
