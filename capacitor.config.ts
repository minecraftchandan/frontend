import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.satarkdrishti.app",
  appName: "Satark Drishti",
  webDir: "dist/android-web",
  android: {
    allowMixedContent: true,
  },
};

export default config;
