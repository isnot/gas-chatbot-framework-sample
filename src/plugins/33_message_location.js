(function (exports) {
  // =================================================================================
  // Start of plugin

  function nearbyLocationTg() {
    const cx = getGlobalContexts();
    const u = cx.utils;
    const mes = cx.tgBot.getMessageData('enable_edited');
    const config = cx.model.getSettings();
    const latlng = u.deepRetrieve(mes, 'location');
    if (typeof latlng !== 'object' || latlng === null) {
      return;
    }

    const ll = latlng.latitude + ',' + latlng.longitude;
    let text = config.orange_lily.reply_location_format.replace(/##LL##/g, ll);

    const response = Maps.newGeocoder()
      .setLanguage('ja')
      .setRegion('jp')
      .reverseGeocode(latlng.latitude, latlng.longitude);
    if (response.status === 'OK') {
      // response.results.forEach(rx => {});
      const address = response.results.shift().formatted_address;
      text = `${text}\n${u.replaceCharactorEntity4TgHtml(address)}\n`;
    }

    let send = '';
    if (cx.bot.isEditedMessage()) {
      const dt = cx.bot.getMessageDateTime('edit_date');
      const mmss = cx.bot.formatDateTime(dt, 'HH:mm:ss');
      text = text + ' updated:' + mmss;
      const last = cx.bot.loadLocation(mes.from.username);
      if (
        u.hasProperty(last, 'dt') &&
        Date.now() - last.dt > config.orange_lily.live_location_duration_sec * 1000
      ) {
        if (u.hasProperty(last, 'message_id')) {
          send = cx.tg.updateMessageHTML(last.chat_id, last.message_id, text);
        } else {
          send = cx.tg.sendTgMessageHTML(mes.from.id, text);
        }
      }
    } else {
      send = cx.tg.sendTgMessageHTML(mes.from.id, text);
    }

    if (send) {
      let rdata;
      try {
        rdata = JSON.parse(send);
      } catch (e) {
        throw new Error('nearbyLocation: error');
      }
      if (u.hasProperty(rdata, 'result') && rdata.ok) {
        cx.tgBot.saveLocation(rdata.result, latlng);
      }
    }
  }

  function handleLocationLine(message) {
    if (cx.bot.target_api !== 'line') {
      return undefined;
    }
    return cx.line.replyMessage(cx.bot.replyToken, {
      type: 'location',
      title: message.title,
      address: message.address,
      latitude: message.latitude,
      longitude: message.longitude,
    });
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    if (cx.bot.target_api === 'tg') {
      manager.addEventListener('location', nearbyLocationTg);
    }
  }

  function setup() {
    return {
      name: 'message_location',
      filename: '33_message_location.js',
      description: 'I respond you some of nearby',
      auther: 'isnot',
      help: '\nロケーションを共有すると、その地点の住所を表示します。',
      isAvailable: true,
      isEnabled: true,
      isLoaded: false,
      registerEvents,
    };
  }

  // End of plugin
  // =================================================================================
  try {
    if (typeof cx !== 'object' && cx === null) {
      throw new Error('no GlobalContexts');
    }
  } catch (e) {
    cx = {
      plugins: {},
    };
  }
  const p = setup();
  cx.plugins[p.filename] = p;
  // =================================================================================
})(this);
