// ==UserScript==
// @name         Steam2Sheets
// @namespace    http://tampermonkey.net/
// @version      v24.11.11
// @description  Add Steam games to Google Sheets.
// @author       mHashem
// @match        https://store.steampowered.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(async function() {
    'use strict';

    const gameName = document.getElementById("appHubAppName").innerText;
    const steamID = window.location.href.match(/\/app\/(\d+)\//)[1];

    const IGDBID = await getIGDBID(steamID);

    if (IGDBID) {
        var addGameBtnDiv = createAddGameBtnDiv();
        observeDOM('#queueActionsCtn', (parentDiv) => {
            parentDiv.insertBefore(addGameBtnDiv, parentDiv.querySelector('div:nth-child(7)'));
        });
        if (await googleApps(1)) return;
        else addGameBtnDiv.addEventListener('mousedown', () => googleApps(2), {once: true});
    }
    ///////////////////////
    function createAddGameBtnDiv() {
        const addGameBtnDiv__ = document.createElement('div');
        addGameBtnDiv__.id = 'addGameBtnDiv';
        addGameBtnDiv__.innerHTML = `<p id="addGameBtn"><span class="material-symbols-outlined">check_box_outline_blank</span>Add Game</p>`;

        GM_addStyle(`
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&icon_names=check_box,check_box_outline_blank");

        #addGameBtnDiv {
            font-size: 15px;
            padding: 0;
            margin: 0;
            display: inline-block;
            flex-grow: 0;
            cursor: pointer;
            user-select: none;
            }
            #addGameBtn {
            padding: 7px;
                color: #61bff7;
                background-color: #274157;
                border-radius: 2px;
            }
            #addGameBtn:hover {
                background-image: linear-gradient(to right, #66bff2, #427d9e);
                color:white;
            }
            .material-symbols-outlined {
            float:left;
            position:relative;
            bottom:0.3rem;
            }
        `);

        return addGameBtnDiv__;
    }
    async function getIGDBID(uid) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'https://api.igdb.com/v4/external_games',
                headers: {
                    'Client-ID': 'client_id',
                    'Authorization': `Bearer access_token`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain'
                },
                data: `fields game; where uid = "${uid}" & category = 1;`,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText)[0].game);
                    } else {
                        console.error('[Steam2Sheets] Failed to get game details:', response.status, response.responseText);
                        reject(response.status);
                    }
                },
                onerror: function(error) {
                    console.error('[Steam2Sheets] Error getting game details:', error);
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
    function googleApps(opcode) {
        let data;
        if (opcode == "1") data = `gameID=${encodeURIComponent(IGDBID)}&gameName=${encodeURIComponent(gameName)}`;
        else if (opcode == "2") data = `gameID=${encodeURIComponent(IGDBID)}&accessToken=${encodeURIComponent("access_token")}`
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'webapp_url',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                data: data,
                onload: function(response) {
                    if (response.responseText === "exist") {
                        addGameBtnDiv.querySelector("span").innerHTML = "check_box";
                        addGameBtnDiv.querySelector("p").style.background = "#4882a6";
                        addGameBtnDiv.style.cursor = "not-allowed";
                        addGameBtnDiv.removeEventListener('mousedown', googleApps);
                        console.log("Game already exist");
                        resolve(true);
                    } else if (response.responseText === "Success"){
                        addGameBtnDiv.querySelector("span").innerHTML = "check_box";
                        addGameBtnDiv.querySelector("p").style.background = "#4882a6";
                        addGameBtnDiv.style.cursor = "not-allowed";
                        addGameBtnDiv.removeEventListener('mousedown', googleApps);
                        console.log("Game added successfully!");
                    }
                    else if (response.responseText === "no exist") {
                        console.log("game doens't exist");
                        resolve(false);
                    }
                    else {
                        console.log("Error adding game.");
                    }
                },
                onerror: function(error) {
                    console.error('Error adding game, details:', error);
                    reject(error);
                }
            });
        });
    }
})();
