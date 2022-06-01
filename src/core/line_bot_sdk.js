class LineBotSdkClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://api.line.me/v2/bot/';

    this.apiUrl = (path) => {
      return '' + this.baseUrl + path;
    };
    this.pushUrl = () => {
      return this.apiUrl('message/push');
    };
    this.replyUrl = () => {
      return this.apiUrl('message/reply');
    };
    this.multicastUrl = () => {
      return this.apiUrl('message/multicast');
    };
    this.broadcastUrl = () => {
      return this.apiUrl('message/broadcast');
    };
    this.contentUrl = (messageId) => {
      return this.apiUrl('message/' + messageId + '/content');
    };
    this.userProfileUrl = (userId) => {
      return this.apiUrl('profile/' + userId);
    };
    this.roomMemberProfileUrl = (roomId, userId) => {
      return this.apiUrl('room/' + roomId + '/member/' + userId);
    };
    this.groupMemberProfileUrl = (groupId, userId) => {
      return this.apiUrl('group/' + groupId + '/member/' + userId);
    };
    this.profileUrl = (eventSource) => {
      switch (eventSource.type) {
        case 'group':
          return this.groupMemberProfileUrl(eventSource.groupId, eventSource.userId);
        case 'room':
          return this.roomMemberProfileUrl(eventSource.roomId, eventSource.userId);
        default:
          return this.userProfileUrl(eventSource.userId);
      }
    };
    this.groupMemberIdsUrl = (groupId) => {
      return this.apiUrl('group/' + groupId + '/members/ids');
    };
    this.roomMemberIdsUrl = (roomId) => {
      return this.apiUrl('room/' + roomId + '/members/ids');
    };
    this.leaveGroupUrl = (groupId) => {
      return this.apiUrl('group/' + groupId + '/leave');
    };
    this.leaveRoomUrl = (roomId) => {
      return this.apiUrl('room/' + roomId + '/leave');
    };
    this.leaveUrl = (eventSource) => {
      switch (eventSource.type) {
        case 'group':
          return this.leaveGroupUrl(eventSource.groupId);
        case 'room':
          return this.leaveRoomUrl(eventSource.roomId);
        default:
          throw new Error('Unexpected eventSource.type to get leave url.');
      }
    };
    this.richMenuUrl = (richMenuId) => {
      return this.apiUrl('richmenu' + (richMenuId ? '/' + richMenuId : ''));
    };
    this.richMenuListUrl = () => {
      return this.apiUrl('richmenu/list');
    };
    this.userRichMenuUrl = (userId, richMenuId) => {
      return this.apiUrl('user/' + userId + '/richmenu' + (richMenuId ? '/' + richMenuId : ''));
    };
    this.richMenuContentUrl = (richMenuId) => {
      return this.apiUrl('richmenu/' + richMenuId + '/content');
    };
    this.defaultRichMenuUrl = (richMenuId) => {
      return this.apiUrl('user/all/richmenu' + (richMenuId ? '/' + richMenuId : ''));
    };
    this.authHeader = () => {
      return {
        Authorization: 'Bearer ' + this.config.channelAccessToken,
      };
    };
  }

  pushMessage(to, messages, notificationDisabled = false) {
    const messageArray = messages instanceof Array ? messages : [messages];
    UrlFetchApp.fetch(this.pushUrl(), {
      contentType: 'application/json',
      headers: this.authHeader(),
      method: 'post',
      payload: JSON.stringify({
        messages: messageArray,
        to,
        notificationDisabled,
      }),
    });
  }

  replyMessage(replyToken, messages, notificationDisabled = false) {
    const messageArray = messages instanceof Array ? messages : [messages];
    UrlFetchApp.fetch(this.replyUrl(), {
      contentType: 'application/json',
      headers: this.authHeader(),
      method: 'post',
      payload: JSON.stringify({
        messages: messageArray,
        replyToken,
        notificationDisabled,
      }),
    });
  }

  multicast(recipients, messages, notificationDisabled = false) {
    const messageArray = messages instanceof Array ? messages : [messages];
    UrlFetchApp.fetch(this.multicastUrl(), {
      contentType: 'application/json',
      headers: this.authHeader(),
      method: 'post',
      payload: JSON.stringify({
        messages: messageArray,
        to: recipients,
        notificationDisabled,
      }),
    });
  }

  broadcast(messages, notificationDisabled = false) {
    const messageArray = messages instanceof Array ? messages : [messages];
    UrlFetchApp.fetch(this.broadcastUrl(), {
      contentType: 'application/json',
      headers: this.authHeader(),
      method: 'post',
      payload: JSON.stringify({
        messages: messageArray,
        notificationDisabled,
      }),
    });
  }

  getProfile(userId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.userProfileUrl(userId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getGroupMemberProfile(groupId, userId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.groupMemberProfileUrl(groupId, userId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getRoomMemberProfile(roomId, userId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.roomMemberProfileUrl(roomId, userId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getProfileWithEventSource(eventSource) {
    return JSON.parse(
      UrlFetchApp.fetch(this.profileUrl(eventSource), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getGroupMemberIds(groupId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.groupMemberIdsUrl(groupId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getRoomMemberIds(roomId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.roomMemberIdsUrl(roomId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  getMessageContent(messageId) {
    return UrlFetchApp.fetch(this.contentUrl(messageId), {
      headers: this.authHeader(),
    }).getBlob();
  }

  leaveGroup(groupId) {
    UrlFetchApp.fetch(this.leaveGroupUrl(groupId), {
      headers: this.authHeader(),
      method: 'post',
    });
  }

  leaveRoom(roomId) {
    UrlFetchApp.fetch(this.leaveRoomUrl(roomId), {
      headers: this.authHeader(),
      method: 'post',
    });
  }

  leaveWithEventSource(eventSource) {
    UrlFetchApp.fetch(this.leaveUrl(eventSource), {
      headers: this.authHeader(),
      method: 'post',
    });
  }

  getRichMenu(richMenuId) {
    return JSON.parse(
      UrlFetchApp.fetch(this.richMenuUrl(richMenuId), {
        headers: this.authHeader(),
      }).getContentText()
    );
  }

  createRichMenu(richMenu) {
    return UrlFetchApp.fetch(this.richMenuUrl(), {
      contentType: 'application/json',
      headers: this.authHeader(),
      method: 'post',
      payload: JSON.stringify(richMenu),
    }).getContentText();
  }

  deleteRichMenu(richMenuId) {
    UrlFetchApp.fetch(this.richMenuUrl(richMenuId), {
      headers: this.authHeader(),
      method: 'delete',
    });
  }

  getRichMenuIdOfUser(userId) {
    return UrlFetchApp.fetch(this.userRichMenuUrl(userId), {
      headers: this.authHeader(),
    }).getContentText();
  }

  linkRichMenuToUser(userId, richMenuId) {
    UrlFetchApp.fetch(this.userRichMenuUrl(userId, richMenuId), {
      headers: this.authHeader(),
      method: 'post',
    });
  }

  unlinkRichMenuFromUser(userId) {
    UrlFetchApp.fetch(this.userRichMenuUrl(userId), {
      headers: this.authHeader(),
      method: 'delete',
    });
  }

  getRichMenuImage(richMenuId) {
    return UrlFetchApp.fetch(this.richMenuContentUrl(richMenuId), {
      headers: this.authHeader(),
    }).getBlob();
  }

  setRichMenuImage(richMenuId, data, contentType) {
    UrlFetchApp.fetch(this.richMenuContentUrl(richMenuId), {
      contentType: contentType,
      headers: this.authHeader(),
      method: 'post',
      payload: data,
    });
  }

  getRichMenuList() {
    return JSON.parse(
      UrlFetchApp.fetch(this.richMenuListUrl(), {
        headers: this.authHeader(),
      }).getContentText()
    ).richmenus;
  }

  setDefaultRichMenu(richMenuId) {
    UrlFetchApp.fetch(this.defaultRichMenuUrl(richMenuId), {
      headers: this.authHeader(),
      method: 'post',
    });
  }

  getDefaultRichMenuId() {
    return UrlFetchApp.fetch(this.defaultRichMenuUrl(), {
      headers: this.authHeader(),
    }).getContentText();
  }

  deleteDefaultRichMenu() {
    UrlFetchApp.fetch(this.defaultRichMenuUrl(), {
      headers: this.authHeader(),
      method: 'delete',
    });
  }
}

function createLineBotSdkClient(config) {
  return new LineBotSdkClient(config.line);
}
