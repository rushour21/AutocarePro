import path from 'node:path';
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind';

Config.setBrowserExecutable('/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
Config.setChromiumOpenGlRenderer('swangle');
Config.setChromeMode('chrome-for-testing');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(3);

const here = process.cwd();
const root = path.resolve(here, '..');
Config.overrideWebpackConfig((config) => {
  const withTailwind = enableTailwind(config);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      // the film imports the app's own components, so "@/..." points at the repo root
      alias: { ...(withTailwind.resolve?.alias ?? {}), '@': root },
      // one copy of react / three, even for files that live outside video/
      modules: [path.resolve(here, 'node_modules'), 'node_modules'],
    },
  };
});
