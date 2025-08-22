<template>
  <div class="topLogo">
    <Media :url="logo_src" gifmode />
  </div>
</template>

<script>
import Media from "@/components/UIElements/MediaEmbed.vue";
var isSafari = false;
try {
  isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
} catch {}

export default {
  name: "logo",
  components: { Media },
  computed: {
    logo_src() {
      if (this.$localData.settings.reducedMotion)
        return "assets://archive/collection/logo_v2_reduced.webm";

      if (isSafari) return "assets://archive/collection/logo_v2_static.png";

      return "assets://archive/collection/logo_v2_full.webm";
    }
  }
};
</script>

<style scoped lang="scss">
.topLogo {
  position: relative;
  img,
  video {
    width: 800px;
    max-width: 100%;
    display: block;
  }
  .web-edition-label {
    position: absolute;
    right: 1%;
    bottom: 2%;
    font-family: "Courier New", Courier, monospace;
    font-size: 14pt;
    color: #00ff00;
    /* Replace #00FF00 with the logo green if available */
    background: transparent;
    pointer-events: none;
    /* No antialiasing */
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
    font-smooth: never;
    text-shadow: none;
    user-select: none;
    letter-spacing: 1px;
  }
}
</style>
