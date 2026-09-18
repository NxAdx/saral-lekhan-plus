const packageJson = require("./package.json");

module.exports = {
  expo: {
    name: "Saral Lekhan",
    slug: "saral-lekhan",
    scheme: "sarallekhan",
    version: packageJson.version,
    sdkVersion: "49.0.0",
    platforms: ["ios", "android"],
    icon: "./assets/ios-light.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon-dark.png",
      resizeMode: "contain",
      backgroundColor: "#D9D7D2",
      dark: {
        image: "./assets/splash-icon-light.png",
        backgroundColor: "#1C1A17",
      },
    },
    android: {
      jsEngine: "hermes",
      package: "com.sarallekhan",
      versionCode: Number(packageJson.androidVersionCode || 1),
      newArchEnabled: true,
      adaptiveIcon: {
        foregroundImage: "./assets/android-adaptive.png",
        backgroundColor: "#D9D7D2",
      },
      softwareKeyboardLayoutMode: "resize",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: "sarallekhan" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    extra: {
      runtimeFlagsUrl: "https://raw.githubusercontent.com/NxAdx/saral-lekhan-plus/main/runtime-flags.json",
      distributionChannel: "direct",
      updaterMode: "github",
      eas: {
        projectId: "d9a30678-cf8c-4f8b-8c28-0b49f63f3208",
      },
    },
    plugins: ["expo-router"],
  },
};
