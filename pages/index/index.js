Component({
  data: {
    questions: [],
    classifications: [],
    classificationSelectedId: "0",
    searchValue: "",
    showCancel: false,
    bottomTips: "",
    page: 1,
    pageSize: 20,
    hasMore: true,
    userType: 0,
    longPressCount: 0,
    triggered: false,
    searching: false,
    isPC: false,
  },
  created() {},
  pageLifetimes: {
    async ready() {
      const { result } = await wx.cloud.callFunction({
        name: "login",
      });
      getApp().globalData.userInfo = result;
      this.setData({
        userType: result.type,
        isPC: wx.getDeviceInfo().platform == "windows",
      });
      this.animate(
        ".search-bar,.hot-tabs-scroll",
        [
          {
            opacity: 0,
          },
          {
            opacity: 1,
          },
        ],
        1000,
        function () {
          this.clearAnimation(".search-bar,.hot-tabs-scroll", {
            opacity: true,
          });
        }.bind(this)
      );
      this.animate(
        "#question-list",
        [
          {
            opacity: 0,
            translateY: 500,
            ease: "ease-in-out",
          },
          {
            opacity: 1,
            translateY: 0,
            ease: "ease-in-out",
          },
        ],
        1000,
        function () {
          this.clearAnimation("#question-list", {
            opacity: true,
            translateY: true,
          });
        }.bind(this)
      );
      await this.getClassifications();
      await this.getQuestions();
      wx.hideLoading();
      if (result.type == 1) {
        wx.showModal({
          title: "提示",
          content: "您已登录为管理员，可以进行管理操作",
          showCancel: false,
        });
      }
    },
    async show() {
      this.setData({
        longPressCount: 0,
      });
    },
  },
  methods: {
    async getClassifications() {
      // 分类列表
      const db = getApp().db;
      const { data } = await db.collection("classification").get();
      // console.log(data);
      data.unshift({
        _id: "0",
        classification: "全部",
      });
      data.push({
        _id: "-1",
        classification: "未分类",
      });

      if (this.data.userType == 1) {
        data.unshift({
          _id: "-2",
          classification: "未回答（管理员）",
        });
        data.unshift({
          _id: "-3",
          classification: "添加分类（管理员）",
        });
      }

      let animations = {};
      data.forEach((item, index) => {
        animations["classifications[" + index + "].animation"] = wx
          .createAnimation({
            duration: 500,
            timingFunction: "ease",
          })
          .opacity(1)
          .translateX(0)
          .step()
          .export();
      });

      this.setData(
        {
          classifications: data,
        },
        () => {
          // 依次显示每个分类标签
          let index = 0;
          let showNextTab = () => {
            if (index < data.length) {
              let key = "classifications[" + index + "].animation";
              this.setData({
                [key]: animations[key],
              });
              index++;
              setTimeout(showNextTab, 100);
            }
          };
          showNextTab();
        }
      );
    },
    async getQuestions(id = "0") {
      // 问答列表
      if (!this.data.hasMore) {
        this.setData({
          bottomTips: "没有更多了",
        });
        return;
      }

      const db = getApp().db;
      const _ = db.command;
      const $ = db.command.aggregate;
      let data;
      let cache = getApp().storage[`${id}#${this.data.page}`];
      if (cache && id != "-2") {
        data = cache;
      } else {
        wx.showLoading({
          title: "加载中",
        });

        let query = db
          .collection("question")
          .aggregate()
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
          .sort({
            view_count: -1,
          });

        if (id == "-1") {
          // 在question模型中查找分类与classification模型中不匹配的数据
          // query = query.lookup({
          //   from: "classification",
          //   let: { classification_id: "$classification_id" },
          //   pipeline: $.pipeline().match(_.expr($.and([$.eq(["$_id", "$$classification_id"])]))),
          //   as: "hasClassification",
          // });
          query = query.match({
            classification_id: null,
          });
        } else if (id == "-2") {
          query = query.match({
            answer_count: 0,
          });
        } else if (id != "0") {
          query = query.match({
            classification_id: id,
          });
        }
        const result = await query
          .skip((this.data.page - 1) * this.data.pageSize)
          .limit(this.data.pageSize)
          .end();
        getApp().storage[`${id}#${this.data.page}`] = result.list;
        wx.hideLoading();
        // console.log(result);
        data = result.list;
      }
      // console.log(data);

      // const startIndex = (this.data.page - 1) * this.data.pageSize;

      // let animations = {};
      // data.forEach((item, index) => {
      //   animations["questions[" + (startIndex + index) + "].animation"] = wx
      //     .createAnimation({
      //       duration: 500,
      //       timingFunction: "ease",
      //     })
      //     .opacity(1)
      //     .translateY(0)
      //     .step()
      //     .export();
      // });
      this.setData({
        questions: this.data.page == 1 ? data : this.data.questions.concat(data),
        searching: false,
      });
      this.setShowShowmoreBtn();
      if (data.length < this.data.pageSize) {
        this.setData({
          hasMore: false,
        });
      } else {
        this.setData({
          page: this.data.page + 1,
        });
      }
    },
    onSearchFocus(e) {
      console.log();
      this.setData({
        showCancel: true,
      });
    },
    onSearchInput(e) {
      this.setData({
        searchValue: e.detail.value,
      });
    },
    onCancelTap(e) {
      // 处理取消搜索的点击事件
      this.setData({
        searchValue: "",
        showCancel: false,
        page: 1,
        hasMore: true,
        searching: false,
      });
      wx.hideKeyboard();
      this.getQuestions(this.data.classificationSelectedId);
    },
    onClearTap(e) {
      // 处理清空搜索的点击事件
      this.setData({
        searchValue: "",
      });
    },
    async onSearchTap(e) {
      this.setData({
        searching: true,
      });
      wx.showLoading({
        title: "搜索中",
      });
      let res;
      const keyword = this.data.searchValue;
      let cache = getApp().storage[`${keyword}`];
      if (cache) {
        res = cache;
      } else {
        const { result } = await wx.cloud.callFunction({
          name: "searchQuestion",
          data: {
            keyword: keyword,
          },
        });
        getApp().storage[`${keyword}`] = result;
        res = result;
      } // 滚动
      wx.createSelectorQuery()
        .select("#question-list")
        .node()
        .exec(res => {
          res[0].node.scrollTo(0, 0);
        });
      this.setData({
        hasMore: false,
      });
      wx.hideLoading();
      if (res.length == 0) {
        this.setData({
          bottomTips: "没有搜索到相关问题",
        });
      }
      this.setData({
        questions: res,
      });
      this.setShowShowmoreBtn();
    },
    // 分类标签点击事件
    async onTabTap(e) {
      this.setData({
        searchValue: "",
        showCancel: false,
        bottomTips: "",
      });
      const targetId = e.currentTarget.dataset.id;
      const originId = this.data.classificationSelectedId;
      // if (targetId == originId) {
      //   return;
      // }
      if (targetId == "-3") {
        // 添加分类
        wx.showModal({
          title: "添加分类",
          placeholderText: "请输入分类名称",
          editable: true,
          success: res => {
            if (res.confirm) {
              const classification = res.content.trim();
              if (classification == "") {
                wx.showToast({
                  title: "分类不能为空",
                  icon: "none",
                  duration: 1000,
                });
                return;
              }
              const db = getApp().db;
              db.collection("classification")
                .add({
                  data: {
                    classification: classification,
                  },
                })
                .then(res => {
                  wx.showToast({
                    title: "添加成功",
                    icon: "none",
                    duration: 1000,
                  });
                  this.getClassifications();
                })
                .catch(err => {
                  wx.showToast({
                    title: "添加失败",
                    icon: "none",
                    duration: 1000,
                  });
                });
            }
          },
        });
      } else {
        this.setData({
          page: 1,
          hasMore: true,
        });
        await this.getQuestions(targetId);
        this.setData({
          classificationSelectedId: targetId,
        });
      }

      // 滚动
      wx.createSelectorQuery()
        .select("#question-list")
        .node()
        .exec(res => {
          res[0].node.scrollTo(0, 0);
        });
    },
    onTabLongPress(e) {
      if (this.data.userType != 1) {
        return;
      }
      wx.vibrateShort({
        type: "light",
        fail: function (res) {
          console.log(res);
        },
      });
      this.setData({
        searchValue: "",
        showCancel: false,
        bottomTips: "",
      });
      const targetId = e.currentTarget.dataset.id;
      if (!["0", "-1", "-2", "-3"].includes(targetId)) {
        console.log(e);
        if (this.data.userType == 1) {
          wx.showModal({
            title: "提示",
            content: "确定删除该分类吗？",
            success: res => {
              if (res.confirm) {
                wx.showLoading({
                  title: "删除中",
                });
                const db = getApp().db;
                db.collection("classification")
                  .doc(targetId)
                  .remove()
                  .then(res => {
                    wx.hideLoading();
                    wx.showToast({
                      title: "删除成功",
                      icon: "none",
                      duration: 1000,
                    });
                    this.getClassifications();
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
      }
    },
    onMoreAnswersTap(e) {
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
    async onScrollToLower(e) {
      // 加载更多
      this.setData({
        bottomTips: "正在加载中...",
      });
      this.getQuestions(this.data.classificationSelectedId);
    },
    onAskTap(e) {
      wx.showLoading({
        title: "加载中",
      });
      wx.navigateTo({
        url: "/pages/ask/ask",
        events: {
          clearStorage: () => {
            this.onRefresh();
          },
        },
        success: () => {
          wx.hideLoading();
        },
      });
    },
    onPersonalPortalTap(e) {
      wx.showLoading({
        title: "加载中",
      });
      wx.navigateTo({
        url: "/pages/myquestion/myquestion",
        events: {
          clearStorage: () => {
            this.onRefresh();
          },
        },
      });
    },
    onEditTap(e) {
      const questionId = e.currentTarget.dataset.id;
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
    },
    onDelTap(e) {
      const questionId = e.currentTarget.dataset.id;
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
                this.setData({
                  questions: this.data.questions.filter(item => item._id != questionId),
                });
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
    },
    async onPersonalPortalLongPress(e) {
      wx.vibrateShort({
        type: "light",
      });

      this.setData({
        longPressCount: this.data.longPressCount + 1,
      });
      console.log(this.data.longPressCount,wx.getDeviceInfo().platform);
      if (wx.getDeviceInfo().platform == "windows"){
        wx.showToast({
          title: 5 - this.data.longPressCount,
          icon: "none",
        })
      }
      if (this.data.longPressCount >= 5) {
        const db = getApp().db;
        const user = getApp().globalData.userInfo;
        const res = await db
          .collection("user")
          .where({
            _openid: user._openid,
          })
          .update({
            data: {
              type: this.data.userType == 0 ? 1 : 0,
            },
          });
        wx.reLaunch({
          url: "/pages/index/index",
        });
      }
    },
    async onRefresh(e) {
      this.setData({
        page: 1,
        hasMore: true,
      });
      getApp().storage = {};
      await this.getClassifications();

      console.log(this.data.searching);
      if (this.data.searching) {
        await this.onSearchTap();
      } else {
        await this.getQuestions(this.data.classificationSelectedId);
      }

      this.setData({
        triggered: false,
      });

      wx.showToast({
        title: "刷新成功",
        icon: "none",
        duration: 1000,
      });
    },
    async onSlideTap(e) {
      const { index, answer } = e.currentTarget.dataset;
      console.log(Math.ceil(answer.length / 19));
      this.setData({
        questions: this.data.questions.map((item, i) => {
          if (i == index) {
            item["showmore"] = item.showmore
              ? ""
              : `height:${Math.ceil(answer.length / 20) * 45}rpx;white-space: unset;`;
          } else {
            item["showmore"] = false;
          }
          return item;
        }),
      });
    },
    setShowShowmoreBtn() {
      this.setData({
        questions: this.data.questions.map(item => {
          if (!item.first_answer) return item;
          item.showShowMoreBtn = Math.ceil(item.first_answer?.length / 19) <= 1 ? false : true;
          return item;
        }),
      });
    },
  },
});
