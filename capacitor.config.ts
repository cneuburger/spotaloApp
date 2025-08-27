import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'spotalo',
  webDir: 'www',
  server: {
    androidScheme: "https"
  },
  plugins: {
    EdgeToEdge: {
      backgroundColor: "#000000",
    }
  }
};

export default config;
