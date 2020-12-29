(function(exports) {
  // =================================================================================
  // Start of plugin

  function downloadContent(messageId, downloadPath) {
    return client.getMessageContent(messageId).then(
      stream =>
        new Promise((resolve, reject) => {
          const writable = fs.createWriteStream(downloadPath);
          stream.pipe(writable);
          stream.on('end', () => resolve(downloadPath));
          stream.on('error', reject);
        })
    );
  }

  function handleSticker(message, replyToken) {
    return client.replyMessage(replyToken, {
      type: 'sticker',
      packageId: message.packageId,
      stickerId: message.stickerId
    });
  }

  function handleImage(message, replyToken) {
    let getContent;
    if (message.contentProvider.type === 'line') {
      const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
      const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

      getContent = downloadContent(message.id, downloadPath).then(downloadPath1 => {
        // ImageMagick is needed here to run 'convert'
        // Please consider about security and performance by yourself
        cp.execSync(`convert -resize 240x jpeg:${downloadPath1} jpeg:${previewPath}`);

        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath1),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath)
        };
      });
    } else if (message.contentProvider.type === 'external') {
      getContent = Promise.resolve(message.contentProvider);
    }

    return getContent.then(({ originalContentUrl, previewImageUrl }) => {
      return client.replyMessage(replyToken, {
        type: 'image',
        originalContentUrl,
        previewImageUrl
      });
    });
  }

  function handleVideo(message, replyToken) {
    let getContent;
    if (message.contentProvider.type === 'line') {
      const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.mp4`);
      const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);

      getContent = downloadContent(message.id, downloadPath).then(downloadPath1 => {
        // FFmpeg and ImageMagick is needed here to run 'convert'
        // Please consider about security and performance by yourself
        cp.execSync(`convert mp4:${downloadPath1}[0] jpeg:${previewPath}`);

        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath1),
          previewImageUrl: baseURL + '/downloaded/' + path.basename(previewPath)
        };
      });
    } else if (message.contentProvider.type === 'external') {
      getContent = Promise.resolve(message.contentProvider);
    }

    return getContent.then(({ originalContentUrl, previewImageUrl }) => {
      return client.replyMessage(replyToken, {
        type: 'video',
        originalContentUrl,
        previewImageUrl
      });
    });
  }

  function handleAudio(message, replyToken) {
    let getContent;
    if (message.contentProvider.type === 'line') {
      const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.m4a`);

      getContent = downloadContent(message.id, downloadPath).then(downloadPath1 => {
        return {
          originalContentUrl: baseURL + '/downloaded/' + path.basename(downloadPath1)
        };
      });
    } else {
      getContent = Promise.resolve(message.contentProvider);
    }

    return getContent.then(({ originalContentUrl }) => {
      return client.replyMessage(replyToken, {
        type: 'audio',
        originalContentUrl,
        duration: message.duration
      });
    });
  }

  function registerEvents() {
    const cx = getGlobalContexts();
    const manager = cx.mgr;
    manager.addEventListener('sticker', handleSticker);
    manager.addEventListener('image', handleImage);
    manager.addEventListener('video', handleVideo);
    manager.addEventListener('audio', handleAudio);
  }

  function setup() {
    return {
      name: 'message_media',
      filename: '32_message_media.js',
      description: 'This is sample plugin.',
      auther: 'isnot',
      help: '',
      isAvailable: true,
      isEnabled: false,
      isLoaded: false,
      registerEvents
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
      plugins: {}
    };
  }
  const p = setup();
  cx.plugins[p.filename] = p;
  // =================================================================================
})(this);
