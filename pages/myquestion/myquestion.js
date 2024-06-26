Page({
  data: {
    questions: "",
    userType: 0,
    triggered: false,
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
  onSlideButtonTap(e) {
    const { index, data: questionId } = e.detail;
    // console.log(index, questionId);
    if (index == 0) {
      wx.showLoading({
        title: "加载中",
      });
      wx.navigateTo({
        url: `/pages/ask/ask?type=edit&questionId=${questionId}`,
        events: {
          updateQuestion: data => {
            this.onRefresh();
          },
        },
        success: res => {
          res.eventChannel.emit(
            "acceptData",
            this.data.questions.find(item => item._id == questionId)
          );
        },
      });
    } else if (index == 1) {
      wx.showModal({
        title: "提示",
        content: "确定删除该问题吗？",
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: "删除中",
            });
            const db = getApp().db;
            db.collection("question")
              .doc(questionId)
              .remove()
              .then(res => {
                wx.hideLoading();
                wx.showToast({
                  title: "删除成功",
                  icon: "none",
                  duration: 1000,
                });
                this.getOpenerEventChannel().emit("clearStorage");
                this.setData({ questions: this.data.questions.filter(item => item._id != questionId) });
                getApp().storage[`${this.data.classificationSelectedId}#${this.data.page}`] =
                  this.data.questions;
              })
              .catch(err => {
                wx.hideLoading();
                console.log(err);
                wx.showToast({
                  title: "删除失败",
                  icon: "none",
                  duration: 1000,
                });
              });
          }
        },
      });
    }
  },
  async onRefresh(e) {
    await this.getMyquestion();

    this.setData({
      triggered: false,
    });

    wx.showToast({
      title: "刷新成功",
      icon: "none",
      duration: 1000,
    });
  },
});
