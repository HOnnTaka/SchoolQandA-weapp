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
    const { result: userinfo } = await wx.cloud.callFunction({
      name: "login",
    });
    app.globalData.userinfo = userinfo;
    console.log(userinfo);
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
    userinfo: null,
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
