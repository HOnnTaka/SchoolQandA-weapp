Page({
  data: {

  },
  async onLoad(options) {
    const { result: userinfo } = await wx.cloud.callFunction({
      name: "login",
    });
    // if(userinfo.avatatUrl == '' || userinfo.nickName == ''){
    //   wx.showModal({
    //     title: '提示',
    //     content: '是否保存头像和昵称',
    //     complete: (res) => {
    //       if (res.cancel) {
            
    //       }
      
    //       if (res.confirm) {
    //         wx.redirectTo({
    //           url: '/pages/login/login'
    //         })
    //       }
    //     }
    //   })
    // }
  },
  onReady() {

  },
  onShow() {

  },
  onHide() {

  },
  onUnload() {

  },
  onShareAppMessage() {
    return {
      title: '',
    };
  },
});