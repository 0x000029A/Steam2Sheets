function getAccessToken() {
  const payload = {
    client_id: 'client_id',
    client_secret: 'client_secret',
    grant_type: 'client_credentials'
  };

  const options = {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    payload: Object.keys(payload).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])).join('&')
  };

  accessToken = JSON.parse(UrlFetchApp.fetch('https://id.twitch.tv/oauth2/token', options).getContentText()).access_token;

  Logger.log(accessToken);
}
