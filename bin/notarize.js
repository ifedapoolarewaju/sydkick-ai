const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!('USE_APPLE_ID' in process.env && 'USE_APPLE_ID_PASS' in process.env)) {
    console.warn(
      'Skipping notarizing step. USE_APPLE_ID and USE_APPLE_ID_PASS env variables must be set'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  await notarize({
    appBundleId: build.appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.USE_APPLE_ID,
    appleIdPassword: process.env.USE_APPLE_ID_PASS,
    teamId: process.env.USE_APPLE_TEAM_ID,
  });
};
