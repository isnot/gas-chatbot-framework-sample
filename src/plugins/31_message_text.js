(function (exports) {
  // =================================================================================
  // Start of plugin

  const buttonsImageURL = `/static/buttons/1040.jpg`;

  // simple reply function
  function replyText(replyToken, myTexts) {
    const cx = getGlobalContexts();
    const texts = Array.isArray(myTexts) ? myTexts : [myTexts];
    return cx.line.replyMessage(
      replyToken,
      texts.map((text) => ({ type: 'text', text }))
    );
  }

  function test_func(mid, text) {
    // テキストメッセージを受け取った
    cx.line.sendText(mid, '「' + text + '」ですね。なるほど〜');
    // スタンプを受け取った
    cx.line.sendSticker(mid, { packageId: 1, id: 2, version: 100 });
    // 上記以外を受け取った
    cx.line.sendText(mid, 'ちょっと何言ってるか分からないです😆');
  }

  function handleProfile(message, replyToken, source) {
    if (source.userId) {
      return client
        .getProfile(source.userId)
        .then((profile) =>
          replyText(replyToken, [
            `Display name: ${profile.displayName}`,
            `Status message: ${profile.statusMessage}`,
          ])
        );
    }
    return replyText(replyToken, "Bot can't use profile API without user ID");
  }

  function handleButtons(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'template',
      altText: 'Buttons alt text',
      template: {
        type: 'buttons',
        thumbnailImageUrl: buttonsImageURL,
        title: 'My button sample',
        text: 'Hello, my button',
        actions: [
          { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
          { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
          { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
          { label: 'Say message', type: 'message', text: 'Rice=米' },
        ],
      },
    });
  }

  function handleConfirm(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'template',
      altText: 'Confirm alt text',
      template: {
        type: 'confirm',
        text: 'Do it?',
        actions: [
          { label: 'Yes', type: 'message', text: 'Yes!' },
          { label: 'No', type: 'message', text: 'No!' },
        ],
      },
    });
  }

  function handleCarousel(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'template',
      altText: 'Carousel alt text',
      template: {
        type: 'carousel',
        columns: [
          {
            thumbnailImageUrl: buttonsImageURL,
            title: 'hoge',
            text: 'fuga',
            actions: [
              { label: 'Go to line.me', type: 'uri', uri: 'https://line.me' },
              { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
            ],
          },
          {
            thumbnailImageUrl: buttonsImageURL,
            title: 'hoge',
            text: 'fuga',
            actions: [
              { label: '言 hello2', type: 'postback', data: 'hello こんにちは', text: 'hello こんにちは' },
              { label: 'Say message', type: 'message', text: 'Rice=米' },
            ],
          },
        ],
      },
    });
  }

  function handleImageCarousel(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'template',
      altText: 'Image carousel alt text',
      template: {
        type: 'image_carousel',
        columns: [
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Go to LINE', type: 'uri', uri: 'https://line.me' },
          },
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Say hello1', type: 'postback', data: 'hello こんにちは' },
          },
          {
            imageUrl: buttonsImageURL,
            action: { label: 'Say message', type: 'message', text: 'Rice=米' },
          },
          {
            imageUrl: buttonsImageURL,
            action: {
              label: 'datetime',
              type: 'datetimepicker',
              data: 'DATETIME',
              mode: 'datetime',
            },
          },
        ],
      },
    });
  }

  function handleDateTime(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'template',
      altText: 'Datetime pickers alt text',
      template: {
        type: 'buttons',
        text: 'Select date / time !',
        actions: [
          { type: 'datetimepicker', label: 'date', data: 'DATE', mode: 'date' },
          { type: 'datetimepicker', label: 'time', data: 'TIME', mode: 'time' },
          { type: 'datetimepicker', label: 'datetime', data: 'DATETIME', mode: 'datetime' },
        ],
      },
    });
  }

  function handleImageMap(message, replyToken, source) {
    return cx.line.replyMessage(replyToken, {
      type: 'imagemap',
      baseUrl: `${baseURL}/static/rich`,
      altText: 'Imagemap alt text',
      baseSize: { width: 1040, height: 1040 },
      actions: [
        {
          area: { x: 0, y: 0, width: 520, height: 520 },
          type: 'uri',
          linkUri: 'https://store.line.me/family/manga/en',
        },
        {
          area: { x: 520, y: 0, width: 520, height: 520 },
          type: 'uri',
          linkUri: 'https://store.line.me/family/music/en',
        },
        {
          area: { x: 0, y: 520, width: 520, height: 520 },
          type: 'uri',
          linkUri: 'https://store.line.me/family/play/en',
        },
        { area: { x: 520, y: 520, width: 520, height: 520 }, type: 'message', text: 'URANAI!' },
      ],
      video: {
        originalContentUrl: `${baseURL}/static/imagemap/video.mp4`,
        previewImageUrl: `${baseURL}/static/imagemap/preview.jpg`,
        area: {
          x: 280,
          y: 385,
          width: 480,
          height: 270,
        },
        externalLink: {
          linkUri: 'https://line.me',
          label: 'LINE',
        },
      },
    });
  }

  function handleBye(message, replyToken, source) {
    switch (source.type) {
      case 'user':
        replyText(replyToken, "Bot can't leave from 1:1 chat");
        break;
      case 'group':
        replyText(replyToken, 'Leaving group').then(() => cx.line.leaveGroup(source.groupId));
        break;
      case 'room':
        replyText(replyToken, 'Leaving room').then(() => cx.line.leaveRoom(source.roomId));
        break;
      default:
    }
    return undefined;
  }

  function handleText(message, replyToken, source) {
    const params = { message, replyToken, source };
    switch (message.text) {
      case 'profile':
      case 'buttons':
      case 'confirm':
      case 'carousel':
      case 'image carousel':
      case 'datetime':
      case 'imagemap':
      case 'bye':
        try {
          cx.mgr.dispatchEvent(message.text, params);
        } catch (err) {
          throw new Error(err);
        }
        break;
      default:
        Logger.log(`Echo message to ${replyToken}: ${message.text}`);
        replyText(replyToken, message.text);
    }
    return undefined;
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('text', handleText);
    manager.addEventListener('profile', handleProfile);
    manager.addEventListener('buttons', handleButtons);
    manager.addEventListener('confirm', handleConfirm);
    manager.addEventListener('carousel', handleCarousel);
    manager.addEventListener('image carousel', handleImageCarousel);
    manager.addEventListener('datetime', handleDateTime);
    manager.addEventListener('imagemap', handleImageMap);
    manager.addEventListener('bye', handleBye);
  }

  function setup() {
    return {
      name: 'message_text',
      filename: '31_message_text.js',
      description: 'This is sample plugin.',
      auther: 'isnot',
      help: 'this is sample',
      isAvailable: true,
      isEnabled: false,
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
