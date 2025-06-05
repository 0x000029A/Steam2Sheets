// v25.03.13
function getGameDetails(id, checkOnly, src) {

  if (checkOnly == 1 && src == 1) {
    body = `fields name; where external_games.uid = "${id}";`;
  }//& external_games.external_game_source.name = "steam"
  else if (checkOnly == 1 && src == 0) {
    body = `fields name; where id = ${id};`;
  }
  else if (checkOnly == 0) {
    body = `fields name, platforms.name, involved_companies.company.name, first_release_date, franchises.name, collections.name, version_title, cover.url, total_rating_count, total_rating, category, game_modes.name, genres.name, keywords.name, player_perspectives.name, themes.name; where id = ${id};`;
  }

  const options = {
    method: 'POST',
    headers: {
      'Client-ID': 'CLIENT-ID',
      'Authorization': 'Bearer TOKEN',
      'Accept': 'application/json'
    },
    payload: body
  };

  const url = 'https://api.igdb.com/v4/games';
  
  const response = UrlFetchApp.fetch(url, options).getContentText();
  
  const parsedResonse = JSON.parse(response)[0];
  
  return parsedResonse;
}

function addGame(id, row, sheet) {
  const details = getGameDetails(id, 0, 0);
  if (!details) return;

  const columns = {
    cover: "A",
    name: "B",
    platform: "D",
    franchise: "F",
    date: "G",
    company: "Q",
    igdbID: "S",
    erating: "U",
    tags: "C"
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
  const sheet = SpreadsheetApp.getActive().getSheetByName('SHEETNAME');

  const SECRET_KEY = "KEY";
  if (!e.parameter.key || e.parameter.key !== SECRET_KEY) {
    return ContentService.createTextOutput("Invalid key");
  }

  const user = Session.getActiveUser().getEmail();
  if (user != "EMAIL") {
    return ContentService.createTextOutput("Unauthorized user");
  }
  const checkOnly = e.parameter.check;
  const id = e.parameter.id;
  const src = e.parameter.src;
  console.log("e.parameter.check:", e.parameter.check);
  console.log("e.parameter.id:", e.parameter.id);
  console.log("e.parameter.src:", e.parameter.src);
  const igdbRow = "S";
  const igdbRange = 'S2:S';
  const nameRange = 'B2:B';

  if (src == 1) { // source: steam
    const gameDetails = getGameDetails(id, 1, src);
    //Logger.log("getGameDetails("+id+", 1, "+src+")= "+gameDetails);
    if (gameDetails) {
      const IGDBID = gameDetails.id;
      //Logger.log("IGDBID: "+IGDBID);
      if (checkOnly == 1) { // check if game exist
        if (sheet.getRange(igdbRange).createTextFinder(IGDBID).matchEntireCell(true).findNext() || sheet.getRange(nameRange).createTextFinder(gameDetails.name).matchEntireCell(true).findNext())
          return ContentService.createTextOutput("exist");
        else
          return ContentService.createTextOutput("no exist");
      } // if (checkOnly == 1)
      else if (checkOnly == 0) { // add game
        lastEmptyRow_B = sheet.getLastRow() + 1;
        addGame(IGDBID, lastEmptyRow_B, sheet);
        if (sheet.getRange(igdbRow + lastEmptyRow_B).getValue() == IGDBID)
          return ContentService.createTextOutput("Success");
      } // else if (checkOnly == 0)
    } // if (gameDetails)
    else
      return ContentService.createTextOutput("Steam AppID is not in IGDB");
  } // if (src)
  else if (src == 0) { // source: igdb
    if (checkOnly == 1) { // check if game exist
    //Logger.log("getGameDetails("+id, ", 1, "+src, ").name:"+getGameDetails(id, 1, src).name);
    //Logger.log("sheet.getRange('B2:B').createTextFinder(getGameDetails(id, 1, src).name).matchEntireCell(true).findNext()"+sheet.getRange('B2:B').createTextFinder(getGameDetails(id, 1, src).name).matchEntireCell(true).findNext());
      if (sheet.getRange(igdbRange).createTextFinder(id).matchEntireCell(true).findNext() ||
          sheet.getRange(nameRange).createTextFinder(getGameDetails(id, 1, src).name).matchEntireCell(true).findNext())
        return ContentService.createTextOutput("exist");
      else
        return ContentService.createTextOutput("no exist");
    }
    else if (checkOnly == 0) { // add game
      lastEmptyRow_B = sheet.getLastRow() + 1;
      addGame(id, lastEmptyRow_B, sheet);
      if (sheet.getRange(igdbRow + lastEmptyRow_B).getValue() == id)
        return ContentService.createTextOutput("Success");
      else
        return ContentService.createTextOutput("G");
    }
  }
  else
    return ContentService.createTextOutput("Unknown source");
}
