// v24.11.13
function getGameDetails(id, checkOnly) {
  if (checkOnly == 1) {
    body = `fields name; where (external_games.uid = "${id}") | (id = ${id});`;
  }
  else if (checkOnly == 0) {
    body = `fields name, platforms.name, involved_companies.company.name, first_release_date, franchises.name, collections.name, version_title, cover.url, total_rating_count, total_rating, category, game_modes.name, genres.name, keywords.name, player_perspectives.name, themes.name; where id = ${id};`;
  }

  const options = {
    method: 'POST',
    headers: {
      'Client-ID': 'Client-ID',
      'Authorization': 'Bearer access_token',
      'Accept': 'application/json',
      'Content-Type': 'text/plain'
    },
    payload: body
  };
  
  return JSON.parse(UrlFetchApp.fetch('https://api.igdb.com/v4/games', options).getContentText())[0];
}

function addGame(id, row, sheet) {
  const details = getGameDetails(id, 0);
  if (!details) return;

  const columns = {
    cover: "A",
    name: "B",
    platform: "C",
    franchise: "E",
    date: "F",
    company: "P",
    igdbID: "R",
    erating: "T",
    tags: "U"
  };

  // TAGS
  var modes = [];
  var genres = [];
  var keywords = [];
  var player_perspectives = [];
  var themes = [];

  if (details.game_modes) modes = details.game_modes.map(game_mode => game_mode.name);
  if (details.genres) genres = details.genres.map(genre => genre.name);
  if (details.keywords) keywords = details.keywords.map(keyword => keyword.name);
  if (details.player_perspectives) player_perspectives = details.player_perspectives.map(player_perspective => player_perspective.name);
  if (details.themes) themes = details.themes.map(theme => theme.name);
  sheet.getRange(columns.tags + row).setValue(modes.concat(genres, keywords, player_perspectives, themes).join(", "))

  // NAME
  if (details.name) sheet.getRange(columns.name + row).setValue(details.name);

  // RATING
  if (details.total_rating) var rating = [Math.ceil(details.total_rating) + "%"];
  if (details.total_rating_count) sheet.getRange(columns.erating + row).setValue(rating.concat(details.total_rating_count).join(", "));

  // IGDB ID
  sheet.getRange(columns.igdbID + row).setValue(id);

  // PLATFORMS
  if (details.platforms) {
    sheet.getRange(columns.platform + row).setValue(details.platforms.map(platform => platform.name).join(", ")
      .replace("PC (Microsoft Windows)", "PC")
      .replaceAll("PlayStation ", "PS")
      .replaceAll("Xbox ", "X")
      .replace("Series ", "S")
      .replaceAll("Nintendo ", "N")
      .replace("Switch", "S")
      .replace("Android", "And")
      .replace("One", "O")
      .replace("GameCube", "GC")
      .replace("Xbox", "X")
      .replace("X|S", "")
      .replace("Linux", "Lin")
      .replace("Google Stadia", "STD")
      .replace("Vita", "V")
      .replace("Portable", "P")
      .replace("Windows Phone", "WiP")
    );
  }

  // COMPANIES
  if (details.involved_companies) sheet.getRange(columns.company + row).setValue(details.involved_companies.map(companies => companies.company.name).join(", "));

  // RELEASE DATE
  if (details.first_release_date) {
    var date = new Date(details.first_release_date * 1000);
    sheet.getRange(columns.date + row).setValue(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);
  }

  // FRANCHISE
  var franchises = [];
  var collections = [];
  if (details.franchises) franchises = details.franchises.map(franchise => franchise.name);
  if (details.collections) collections = details.collections.map(collection => collection.name);
  sheet.getRange(columns.franchise + row).setValue(franchises.concat(collections).join(", "));

  // COVER
  if (details.cover) sheet.getRange(columns.cover + row).setValue('=IMAGE("https:' + details.cover.url + '", 4, 53, 40)');
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet');

  const checkOnly = e.parameter.check;
  const id = e.parameter.id;
  const src = e.parameter.src;

  if (src == 1) { // source: steam
    const gameDetails = getGameDetails(id, 1);
    if (gameDetails) {
      Logger.log(gameDetails);
      const IGDBID = gameDetails.id;
      if (checkOnly == 1) { // check if game exist
        if (sheet.getRange('R2:R').createTextFinder(IGDBID).findNext() || sheet.getRange('B2:B').createTextFinder(gameDetails.name).findNext())
          return ContentService.createTextOutput("exist");
        else
          return ContentService.createTextOutput("no exist");
      } // if (checkOnly == 1)
      else if (checkOnly == 0) { // add game
        lastEmptyRow_B = sheet.getLastRow() + 1;
        addGame(IGDBID, lastEmptyRow_B, sheet);
        if (sheet.getRange("R" + lastEmptyRow_B).getValue() == IGDBID)
          return ContentService.createTextOutput("Success");
      } // else if (checkOnly == 0)
    } // if (gameDetails)
    else
      return ContentService.createTextOutput("Steam AppID is not in IGDB");
  } // if (src)
  else if (src == 0) { // source: igdb
    if (checkOnly == 1) { // check if game exist
      if (sheet.getRange('R2:R').createTextFinder(id).findNext() || sheet.getRange('B2:B').createTextFinder(getGameDetails(id, 1).name).findNext())
        return ContentService.createTextOutput("exist");
      else
        return ContentService.createTextOutput("no exist");
    }
    else if (checkOnly == 0) { // add game
      lastEmptyRow_B = sheet.getLastRow() + 1;
      addGame(id, lastEmptyRow_B, sheet);
      if (sheet.getRange("R" + lastEmptyRow_B).getValue() == id)
        return ContentService.createTextOutput("Success");
      else
        return ContentService.createTextOutput("G");
    }
  }
  else
    return ContentService.createTextOutput("Unknown request");
}