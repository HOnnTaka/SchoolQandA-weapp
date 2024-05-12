App({
  async onLaunch() {
    wx.showLoading({
      title: "加载中",
    });

    const app = this;
    wx.cloud.init({
      env: "dz-q-and-a-4gyin7qna06146b1",
    });
    app.db = wx.cloud.database({
      env: "dz-q-and-a-4gyin7qna06146b1",
    });
    // console.log(userinfo);
    // try {
    //   const { usertype } = await app.db
    //     .collection("user")
    //     .where({
    //       _openid: app.globalData.userinfo.openid,
    //     })
    //     .get();
    //     console.log(usertype);
    //     if(!usertype){
    //       // 未注册,跳转注册页面
    //       wx.navigateTo({
    //         url: "/pages/register/register",
    //       });
    //     }
    // } catch (e) {
    //   errHandler(e);
    // }

    // const res = await this.$http("GET", "/userinfo");
    // globalData.userinfo = res.data;
    // const cacheManager = wx.createCacheManager({ mode: "always" });
    // cacheManager.addRule(/https?:\/\/.*/gi); 

    // cacheManager.on("enterWeakNetwork", () => {
    //   console.log("enterWeakNetwork");
    // });
    // cacheManager.on("exitWeakNetwork", () => {
    //   console.log("exitWeakNetwork");
    // });
    // cacheManager.on("request", evt => {
    //   return new Promise(async (resolve, reject) => {
    //     const matchRes = cacheManager.match(evt);
    //     if (matchRes) {
    //       resolve(matchRes.data || null);
    //     } else {
    //       const res = await evt.request();
    //       resolve(res);
    //     }
    //   });
    // });
  },

  onError(err) {
    console.error(err);
    wx.showToast({
      title: "请求失败",
      icon: "error",
      duration: 2000,
    });
  },
  globalData: {
    userInfo: null,
  },
  db: null,
  // $http(methods, url, data) {
  //   return new Promise((resolve, reject) => {
  //     wx.cloud.callContainer({
  //       config: {
  //         env: "prod-5g0ylzqbfad79295",
  //       },
  //       path: url,
  //       data: data,
  //       methods: methods,
  //       header: {
  //         "X-WX-SERVICE": "",
  //       },
  //       success: res => {
  //         resolve(res);
  //       },
  //       fail: err => {
  //         wx.showToast({
  //           title: "请求失败",
  //           icon: "error",
  //           duration: 2000,
  //         });
  //         reject(err);
  //       },
  //     });
  //   });
  // },
});
