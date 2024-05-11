Component({
  data: {
    questions: [],
    backup: [],
    classifications: [],
    classificationSelectedId: "0",
    searchValue: "",
    showCancel: false,
    bottomTips: "",
    page: 1,
    pageSize: 10,
    hasMore: true,
  },
  pageLifetimes: {
    // 获取问答列表
    async ready() {
      await this.getClassifications();
      await this.getQuestions();
      wx.hideLoading();
    },
    // 页面显示
    show() {
      this.animate(
        ".search-bar,.hot-tabs-scroll",
        [{ opacity: 0 }, { opacity: 1 }],
        1000,
        function () {
          this.clearAnimation(".search-bar,.hot-tabs-scroll", { opacity: true });
        }.bind(this)
      );
      this.animate(
        "#question-list",
        [
          { opacity: 0, translateY: 500, ease: "ease-in-out" },
          { opacity: 1, translateY: 0, ease: "ease-in-out" },
        ],
        1000,
        function () {
          this.clearAnimation("#question-list", { opacity: true, translateY: true });
        }.bind(this)
      );
    },
  },
  methods: {
    async getClassifications() {
      // 分类列表
      const db = getApp().db;
      const { data } = await db.collection("classification").get();
      // console.log(data);
      data.unshift({ _id: "0", classification: "全部" });

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
        this.setData({ bottomTips: "没有更多了" });
        return;
      }
      const db = getApp().db;
      let res;

      let cache = wx.getStorageSync(`${id}#${this.data.page}`);
      if (cache) {
        res = cache;
      } else {
        if (id != "0") {
          res = await db
            .collection("question")
            .orderBy("view_count", "desc")
            .where({ classification_id: id })
            .skip(this.data.pageSize * (this.data.page - 1))
            .limit(this.data.pageSize)
            .get();
        } else {
          res = await db
            .collection("question")
            .orderBy("view_count", "desc")
            .skip(this.data.pageSize * (this.data.page - 1))
            .limit(this.data.pageSize)
            .get();
        }
        wx.setStorageSync(`${id}#${this.data.page}`, res);
      }

      const data = res.data;

      const startIndex = (this.data.page - 1) * this.data.pageSize;

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
      });

      // this.animate(
      //   `.question-item:nth-child(${startIndex})`,
      //   [{ opacity: 0 }, { opacity: 1 }],
      //   500,
      //   function () {
      //     this.clearAnimation(".question-item", { opacity: true });
      //   }.bind(this)
      // );
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
        pageSize: 10,
        hasMore: true,
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
      let res;
      const keyword = this.data.searchValue;
      let cache = wx.getStorageSync(`${keyword}`);
      if (cache) {
        res = cache;
      } else {
        const { result } = await wx.cloud.callFunction({
          name: "searchQuestion",
          data: {
            keyword: keyword,
          },
        });
        wx.setStorageSync(`${keyword}`, result);
        res = result;
      }

      if (res.length == 0) {
        this.setData({
          bottomTips: "没有搜索到相关问题",
        });
      }

      this.setData({
        questions: res,
      });
    },
    async onTabTap(e) {
      this.setData({
        searchValue: "",
        showCancel: false,
      });
      const targetId = e.currentTarget.dataset.id;
      const originId = this.data.classificationSelectedId;
      if (targetId == originId) {
        return;
      }
      this.setData({
        page: 1,
        pageSize: 10,
        hasMore: true,
      });
      await this.getQuestions(targetId);
      this.setData({
        classificationSelectedId: targetId,
      });
      // 滚动
      wx.createSelectorQuery()
        .select("#question-list")
        .node()
        .exec(res => {
          res[0].node.scrollTo(0, 0);
        });
    },
    onMoreAnswersTap(e) {
      // 处理查看更多答案的点击事件
      console.log("查看更多答案");
    },
    async onScrollToLower(e) {
      // 加载更多
      this.setData({ bottomTips: "正在加载中..." });
      this.getQuestions(this.data.classificationSelectedId);
    },
    onAskTap(e) {
      wx.navigateTo({
        url: "/pages/ask/ask",
      });
    },
  },
});
