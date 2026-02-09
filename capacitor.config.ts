import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alliance617.emotionaldiary",
  appName: "Flow : AI 일기 · 감정 그래프",
  webDir: "out",
  // server: {
  //   url: "http://10.0.2.2:3000", // Android 에뮬레이터에서 WSL/Windows 호스트 접근
  //   cleartext: true,
  // },
};

export default config;

// npm run build
// npx cap sync android
// rsync -a --delete /home/anakin/bible-cbt/bible-cbt-diary/android/ /mnt/d/tmp/bible-cbt-android/
// rsync -a --delete /home/anakin/bible-cbt/bible-cbt-diary/node_modules/@capacitor/ /mnt/d/tmp/node_modules/@capacitor/.
// rsync -a --delete /home/anakin/bible-cbt/bible-cbt-diary/node_modules/@capawesome/ /mnt/d/tmp/node_modules/@capawesome/
