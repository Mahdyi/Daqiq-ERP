const target = (process.env.PGRST_BASE_URL || process.env.POSTGREST_BASE_URL || 'http://127.0.0.1:3000').replace(
  /\/$/,
  ''
);

console.log(`[Daqiq ERP proxy] /api -> ${target}`);

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api': ''
    },
    logLevel: 'info'
  }
};
