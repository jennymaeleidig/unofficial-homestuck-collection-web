<template>
  <transition name="notif-list">
    <div v-if="isMobile && showNotification" class="notifWrapper mobile-notif">
      <div class="notif">
        <button class="close" @click="dismiss">
          <div class="innerClose">✕</div>
        </button>
        <div class="frame">
          <div class="innerFrame">
            <div class="info">
              <span class="title">Mobile Experience Limited</span>
              <span class="desc">
                Some features of this site may not be accessible or may not work
                correctly on mobile devices.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "MobileNotification",
  data() {
    return {
      showNotification: true,
      isMobile: false
    };
  },
  mounted() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    // Only show if not dismissed this session
    if (sessionStorage.getItem("mobileNotifDismissed") === "true") {
      this.showNotification = false;
    }
  },
  methods: {
    dismiss() {
      this.showNotification = false;
      sessionStorage.setItem("mobileNotifDismissed", "true");
    }
  }
};
</script>

<style scoped lang="scss">
/* Notification styles copied from Notifications.vue for mobile-notif */
.mobile-notif {
  z-index: 10000;
  right: 0;
  left: 0;
  margin: 0 auto;
  width: 95vw;
  max-width: 400px;
  position: fixed;
  bottom: 10px;
  pointer-events: none;
}
.mobile-notif .notif {
  pointer-events: auto;
  display: inline-block;
  position: relative;
  list-style: none;
  width: 100%;
  opacity: 1;
  z-index: 5;
  margin-bottom: 10px;
  transition: all .2s;
}
.mobile-notif .close {
  position: absolute;
  left: -35px;
  padding: 0;
  width: 30px;
  height: 30px;
  border: solid 3px #ff9000;
  background: black;
}
.mobile-notif .close:hover {
  cursor: pointer;
}
.mobile-notif .innerClose {
  width: 100%;
  height: 100%;
  border: 2px solid #ffff00;
  box-sizing: border-box;
  color: white;
}
.mobile-notif .frame {
  border: 4px solid #ff9000;
  display: flex;
  text-decoration: none;
}
.mobile-notif .frame:hover {
  cursor: pointer;
}
.mobile-notif .innerFrame {
  font-size: 14px;
  line-height: 1.6;
  width: 100%;
  padding: 10px;
  color: white;
  background: black;
  border: 3px solid #ffff00;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  user-select: none;
}
.mobile-notif .thumb {
  align-self: center;
  width: 64px;
  height: 64px;
}
.mobile-notif .arrow {
  margin-left: 10px;
  line-height: 1;
}
.mobile-notif .info {
  margin-left: 5px;
}
.mobile-notif .title {
  line-height: 1;
  display: block;
  font-size: 16px;
}
.mobile-notif .desc {
  padding-top: 3px;
  display: block;
  font-family: Verdana, Arial, Helvetica, sans-serif;
  font-weight: normal;
  font-size: 12px;
  color: #969696;
}
</style>
</style>
