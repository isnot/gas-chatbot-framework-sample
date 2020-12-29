/**
 * [Apple_bot]
 * model: abstract
 */
class AbstractAppleModel {
  constructor(option) {
    // call super(option) first before your own.
    this.VENDER_ID = 'Apple';
    this.SETTINGS_SHEET_NAME = 'SettingsSheet';
    this.option = option;
  }

  getSheet(sname, ss_id_opt) {
    const cx = getGlobalContexts();
    let ss_id;
    let so;
    if (typeof sname !== 'string' || sname === '') {
      return undefined;
    }
    if (typeof ss_id_opt === 'string' && ss_id_opt !== '') {
      ss_id = ss_id_opt;
    } else {
      ss_id = cx.spreadsheet_id;
    }
    const cache_key = 'settings_sheet_object_' + ss_id;
    try {
      if (cx.utils.hasProperty(cx, cache_key) && typeof cx[cache_key] === 'object') {
        so = cx[cache_key];
      } else {
        so = SpreadsheetApp.openById(ss_id);
        cx[cache_key] = so;
      }
    } catch (e) {
      Logger.log('getSheet: ' + e);
      throw new Error('getSheet: ' + e);
    }
    return so.getSheetByName(sname);
  }

  loadSettings() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config_sheet = this.getSheet(this.SETTINGS_SHEET_NAME);
    const config = {};
    let section = 'end';

    let values = [];
    if (config_sheet) {
      values = config_sheet.getRange(1, 1, config_sheet.getLastRow(), 2).getDisplayValues();
    }

    values.forEach(cols => {
      let key = cols[0];
      // 空行と#コメント行は無視
      if (key && key.indexOf('#') !== 0) {
        if (key.indexOf('%') === 0) {
          section = key.substring(1);
          key = '@' + section;
        }
        if (section !== 'end') {
          if (!u.hasProperty(config, section) || typeof config[section] !== 'object') {
            config[section] = {};
          }
          if (key.indexOf('@') === 0) {
            if (!u.hasProperty(config[section], key) || !Array.isArray(config[section][key])) {
              config[section][key] = [];
            }
            config[section][key].push(cols[1]);
          } else {
            config[section][key] = cols[1];
          }
        }
      }
    });
    values = [];
    delete config.end;

    const tz = u.deepRetrieve(config, 'misc.TimeZone');
    const dtf = u.deepRetrieve(config, 'misc.DateTime_format');
    if (tz && dtf) {
      config.datetime = Utilities.formatDate(new Date(), tz, dtf);
    }

    cx.config = config;
  }

  getSettings() {
    const cx = getGlobalContexts();
    if (!cx.utils.hasProperty(cx, 'config')) {
      this.loadSettings();
    }
    return cx.config;
  }

  loadSheetContents(s_name_opt, pkey_index, col_names) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    let ss_id;
    let s_name;
    if (s_name_opt.indexOf('@@') > 0) {
      const tmp = s_name_opt.split('@@', 2);
      ss_id = tmp[1];
      s_name = tmp[0];
    } else {
      ss_id = undefined;
      s_name = s_name_opt;
    }
    // Logger.log(['loadSheetContents', s_name, ss_id]);
    const sheet = this.getSheet(s_name, ss_id);
    const values = sheet.getSheetValues(2, 1, sheet.getLastRow(), sheet.getLastColumn());
    const c = u.ArrayArray2Any(values, pkey_index, col_names);
    // delete c[''];
    return c;
  }

  replaceSheetContent(sheet, values) {
    sheet.clear();
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }

  // スプシに保存
  updateSheet(
    s_name = '',
    data = {},
    func = (idx, obj) => {
      return [];
    }
  ) {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const config = cx.model.getSettings();

    // スプシ確保
    const sheet = cx.model.getSheet(s_name, config.spreadsheets.spreadsheets_id);
    const maxCol = sheet.getLastColumn();
    const values = [];

    // set title row
    values.push(func.call(this, undefined));
    // if (maxCol && maxCol > 0) {
    //   values = sheet.getSheetValues(1, 1, 1, maxCol);
    // }

    u.each(data, (uid, ix) => {
      if (uid) {
        values.push(func.call(this, ix));
      }
    });
    if (values.length > 1) {
      // シート初期化 シートへ保存
      this.replaceSheetContent(sheet, values);
    }
    return values.length;
  }

  appendRowCarefully(sheet, row = []) {
    const cx = getGlobalContexts();
    if (cx.utils.hasProperty(sheet, 'appendRow') && row.length > 0) {
      sheet.appendRow(row);
    }
  }

  getArchiverSheetInfo() {
    const cx = getGlobalContexts();
    return cx.bot.getArchiverSheetInfo();
  }

  getArchiverSheet() {
    const ss_info = this.getArchiverSheetInfo();
    return this.getSheet(ss_info.sheet_name, ss_info.sheet_id);
  }
}
