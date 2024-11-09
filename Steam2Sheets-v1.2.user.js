// ==UserScript==
// @name         Steam2Sheets
// @namespace    http://tampermonkey.net/
// @version      v1.2
// @description  Add Steam games to Google Sheets.
// @author       mHashem
// @match        https://store.steampowered.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==


(async function() {
    'use strict';

    const gameName = document.getElementById("appHubAppName").innerText;
    const steamID = window.location.href.match(/\/app\/(\d+)\//)[1];

    const igdbID = await getGameID(steamID);

    if (igdbID) {
        if (googleApps(1)) return;
        const igdbDiv = createIGDBDiv(igdbID);
        observeDOM('#queueActionsCtn', (parentDiv) => {
            const clearDiv = parentDiv.querySelector('div:nth-child(7)');
            parentDiv.insertBefore(igdbDiv, clearDiv);
        });
        igdbDiv.addEventListener('mousedown', () => googleApps(2), {once: true});
    }

    function createIGDBDiv(igdbID) {
        const igdbDiv = document.createElement('div');
        igdbDiv.id = 'igdbDivID';
        igdbDiv.innerHTML = `<p id="igdbPID"><span id="checkbox_icon" class="material-symbols-outlined">check_box_outline_blank</span>Add Game</p>`;

        GM_addStyle(`
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&icon_names=check_box,check_box_outline_blank");

        #igdbDivID {
            font-size: 15px;
            padding: 0;
            margin: 0;
            display: inline-block;
            flex-grow: 0;
            cursor: pointer;
            user-select: none;
            }
            #igdbPID {
            padding: 7px;
                color: #61bff7;
                background-color: #274157;
                border-radius: 2px;
            }
            #igdbPID:hover {
                background-image: linear-gradient(to right, #66bff2, #427d9e);
                color:white;
            }
            .material-symbols-outlined {
            float:left;
            position:relative;
            bottom:0.3rem;
            }
        `);

        return igdbDiv;
    }

    async function getAccessToken() {
        let accessToken = GM_getValue('twitchAccessToken', null);
        if (!accessToken) {
            const payload = new URLSearchParams({
                client_id: 'CLIENT_ID',
                client_secret: 'CLIENT_SECRET',
                grant_type: 'client_credentials'
            }).toString();

            accessToken = await new Promise((resolve, reject) => {
                GM.xmlHttpRequest({
                    method: 'POST',
                    url: 'https://id.twitch.tv/oauth2/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: payload,
                    onload: function(response) {
                        if (response.status === 200) {
                            const responseJson = JSON.parse(response.responseText);
                            resolve(responseJson.access_token);
                            GM_setValue('twitchAccessToken', responseJson.access_token);
                            setTimeout(() => GM_setValue('twitchAccessToken', null), Number(responseJson.expires_in) * 1000);
                        } else {
                            console.error('[STEAM2SHEETS] Failed to get access token:', response.status, response.responseText);
                            reject(response.status);
                        }
                    },
                    onerror: function(error) {
                        console.error('[STEAM2SHEETS] Error getting access token:', error);
                        reject(error);
                    }
                });
            });
        }
        return accessToken;
    }

    async function getGameID(uid) {
        const accessToken = await getAccessToken();
        const body = `fields game; where uid = "${uid}" & category = 1;`;

        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://api.igdb.com/v4/external_games',
                headers: {
                    'Client-ID': 'CLIENT_ID',
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain'
                },
                data: body,
                onload: function(response) {
                    if (response.status === 200) {
                        const gameDetails = JSON.parse(response.responseText)[0];
                        resolve(gameDetails.game);
                    } else {
                        console.error('[STEAM2SHEETS] Failed to get game details:', response.status, response.responseText);
                        reject(response.status);
                    }
                },
                onerror: function(error) {
                    console.error('[STEAM2SHEETS] Error getting game details:', error);
                    reject(error);
                }
            });
        });
    }

    function observeDOM(selector, callback) {
        const targetNode = document.querySelector(selector);
        if (targetNode) {
            callback(targetNode);
        } else {
            const observer = new MutationObserver(() => {
                const target = document.querySelector(selector);
                if (target) {
                    observer.disconnect();
                    callback(target);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
    //////////////////
    function googleApps(opcode) {
        let data;
        if (opcode == "1") data = `gameID=${encodeURIComponent(igdbID)}&gameName=${encodeURIComponent(gameName)}`;
        else if (opcode == "2") data = `gameID=${encodeURIComponent(igdbID)}&accessToken=${encodeURIComponent(GM_getValue('twitchAccessToken'))}`
        GM.xmlHttpRequest({
            method: "POST",
            url: "WEBAPP_URL",
            data: data,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            onload: function(response) {
                console.log(response.responseText);
                if (response.responseText === "exist") {
                    document.getElementById("checkbox_icon").innerHTML = "check_box";
                    document.getElementById("igdbPID").style.background = "#4882a6";
                    document.getElementById("igdbDivID").style.cursor = "not-allowed";
                    document.getElementById("igdbDivID").removeEventListener('click', googleApps);
                    console.log("Game already exist");
                    return true;
                }
                else if (response.responseText === "Success") {
                    document.getElementById("checkbox_icon").innerHTML = "check_box";
                    document.getElementById("igdbPID").style.background = "#4882a6";
                    document.getElementById("igdbDivID").style.cursor = "not-allowed";
                    document.getElementById("igdbDivID").removeEventListener('click', googleApps);
                    console.log("Game added successfully!");
                }
                else if (response.responseText === "no exist") {
                    console.log("game doens't exist");
                    return false;
                }
                else {
                    console.log("Error adding game.");
                }
            }
        });
    }
})();