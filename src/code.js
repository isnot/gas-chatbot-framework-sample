// [Apple_bot]
// code.js <- this file. globals / bootstrap
// core/ framework
// plugins/ plugins

function myTest() {
  const prop = PropertiesService.getScriptProperties().getProperties();

  // eslint-disable-next-line prettier/prettier


  // eslint-disable-next-line no-use-before-define,prettier/prettier
  // doPost({parameter: {ss: cx.spreadsheet_id, btype: 'telegram'}, postData: {length: 200, type: 'application/json', contents: text}});

  // eslint-disable-next-line no-use-before-define
  const cx = getGlobalContexts();
  cx.spreadsheet_id = '';
  // eslint-disable-next-line no-use-before-define
  initGlobalContexts('line');

  const data = JSON.parse(text) || {};
  cx.incoming = data;
  cx.requestContents = text;
  cx.outgoing = new Set();
  const config = cx.model.getSettings();

}

function test_InlineKeyboardManager() {
  // eslint-disable-next-line no-use-before-define
  const cx = getGlobalContexts();
  // cx.spreadsheet_id = '';
  // eslint-disable-next-line no-use-before-define
  initGlobalContexts();
  const kbm = createInlineKeyboardManager();

  Logger.log('start test for InlineKeyboardManager');

  kbm.addRow(
    [
      kbm.createInlineKeyboardButton('1 1'),
      kbm.createInlineKeyboardButton(['1 2', '1-2-cb']),
      kbm.createInlineKeyboardButton({ text: '1 3', callback_data: '1-3-cb' }),
      kbm.createInlineKeyboardButton({
        text: '1 4',
        callback_data: '1-4-cb',
        url: 'https://example.com/1-4'
      }),
      kbm.createInlineKeyboardButton('2 1'),
      kbm.createInlineKeyboardButton('2 2'),
      kbm.createInlineKeyboardButton('2 3'),
      kbm.createInlineKeyboardButton('2 4'),
      kbm.createInlineKeyboardButton('3 1'),
      kbm.createInlineKeyboardButton('3 2')
    ],
    { cols: 4 }
  );

  const kb = kbm.getInlineKeyboardMarkup();
  Logger.log(kb);
}

/**
 * getGlobalContexts
 *
 * @param none
 * @return cx
 *
 */
function getGlobalContexts() {
  try {
    if (typeof cx === 'object' && cx !== null) {
      return cx;
    }
    throw new Error('no GlobalContexts');
  } catch (e) {
    cx = {
      plugins: {}
    };
    // if ((e instanceof ReferenceError) || e.name === 'ReferenceError') {}
  }
  Logger.log(cx);
  return cx;
}

function selectBotType(type = '') {
  const cx = getGlobalContexts();
  const bots = {
    line: 'lineBot',
    telegram: 'tgBot'
  };
  let select;
  if (typeof type === 'string' && cx.utils.hasProperty(bots, type)) {
    select = bots[type];
  } else {
    const config = cx.model.getSettings();
    select = bots[config.bot.primary_bot_type.toLowerCase()];
  }
  Object.values(bots).forEach(b => {
    cx[b].isPrimary = false;
  });
  cx.bot = cx[select];
  cx.bot.isPrimary = true;
  return select;
}

function initGlobalContexts(type = '') {
  const cx = getGlobalContexts();
  cx.utils = createAppleUtils();
  cx.model = createAppleModel();
  cx.model.loadSettings(cx.spreadsheet_id);
  const config = cx.model.getSettings();

  cx.tgBot = createTelegramBot();
  cx.tg = createTelegramBotApi();
  cx.lineBot = createLineBot(config);
  cx.line = createLineBotSdkClient(config);
  selectBotType(type);

  cx.mgr = createAppleManager();
  cx.mgr.setValidHandlerTypes(cx.bot.getValidHandlerTypes());
}

function minute() {
  const prop = PropertiesService.getScriptProperties().getProperties();
  const now = new Date();
  const now_min = now.getMinutes();
  const mes = '';

  const cx = getGlobalContexts();
  // cx.spreadsheet_id = '';
  initGlobalContexts();
  // const config = cx.model.getSettings();
  // cx.bot.sendToAdmin('minute: ' + mes);
}

function doGet(request) {
  // let prop =  PropertiesService.getScriptProperties().getProperties();
  // return ContentService.createTextOutput('ok');

  // Build and return HTML in IFRAME sandbox mode.
  const template = HtmlService.createTemplateFromFile('start');
  return template
    .evaluate()
    .setTitle('start')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function doPost(request) {
  let spreadsheet_id;
  if (typeof request === 'object' && request.parameter.ss) {
    spreadsheet_id = request.parameter.ss;
  } else {
    spreadsheet_id = PropertiesService.getScriptProperties().getProperties().settings_spreadsheet_id;
  }
  let bot_type = '';
  if (typeof request === 'object' && request.parameter.btype) {
    bot_type = request.parameter.btype || '';
  }

  // build cx and prepare.
  const cx = getGlobalContexts();
  cx.spreadsheet_id = spreadsheet_id;
  initGlobalContexts(bot_type);
  // cx.request_parameter = request.parameter;

  // registerEvents: plugins can use cx(GlobalContents).
  const plugin_filenames = Object.keys(cx.plugins).sort();
  plugin_filenames.forEach(pfn => {
    const px = cx.plugins[pfn];
    if (px.isAvailable && px.isEnabled && !px.isLoaded) {
      px.isLoaded = true;
      px.registerEvents.call(undefined);
    }
  });

  // run each event listener
  return cx.bot.dispatch(request);
}
