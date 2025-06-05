// ==UserScript==
// @name         IGDB2Sheets
// @namespace    http://tampermonkey.net/
// @version      25.03.11
// @description  Add IGDB games to Google Sheets.
// @author       mHashem
// @match        https://www.igdb.com/games/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=igdb.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @tag          automation
// ==/UserScript==

(async function() {
    'use strict';

    const IGDBID_elm = await observeDOM("div.MuiGrid2-root.MuiGrid2-direction-xs-row > div > div.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.MuiGrid2-grid-md-3 > div > div:nth-child(1) > div > p");
    const IGDBID = IGDBID_elm.innerText.match(/IGDB ID: (.*)/)[1];
    if (!IGDBID) return;

    var addGameButton = createAddGameButton();
    const parentDiv = await observeDOM("div.MuiGrid2-root.MuiGrid2-direction-xs-row > div.MuiGrid2-root.MuiGrid2-container.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12 > div > div > div.MuiGrid2-root.MuiGrid2-container.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12 > div.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.MuiGrid2-grid-sm-6.MuiGrid2-grid-md-3");
    parentDiv.appendChild(addGameButton);

    if (await sendToGoogleApps(1)) return;
    addGameButton.addEventListener('mousedown', () => sendToGoogleApps(0), {once: true});

    function createAddGameButton() {
        const button = document.createElement('div');
        button.id = "addGameButton";
        button.innerHTML = `<p><span class="material-symbols-outlined">check_box_outline_blank</span> Add Game</p>`;

        GM_addStyle(`
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&icon_names=check_box,check_box_outline_blank");

        #addGameButton {
        width: 100%;
        background-color: #40414c;
        padding-top: 4%;
        padding-bottom: 2%;
        border-radius: 4px;
        user-select:none;
        cursor:pointer;
        }

        #addGameButton p {
        font-size: 20px;
        margin-left: 1%;
        }

        .material-symbols-outlined {
        float:left;
        position:relative;
        top:0.1rem;
        margin-right: 1%;
        }

        `);

        return button;
    }

    async function observeDOM(selector) {
        return new Promise((resolve) => {
            const targetNode = document.querySelector(selector);
            if (targetNode) {
                resolve(targetNode);
            } else {
                const observer = new MutationObserver(() => {
                    const target = document.querySelector(selector);
                    if (target) {
                        observer.disconnect();
                        resolve(target);
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    function sendToGoogleApps(checkOnly) {
        console.log("Sending request with checkOnly:", checkOnly);
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'URL',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                data: `key=KEY&check=${checkOnly}&id=${IGDBID}&src=0`,
                onload(response) {
                    const resText = response.responseText.trim();
                    console.log("Response:", resText);

                    if (response.responseText === "exist") {
                        updateButtonState(true);
                        resolve(true);
                    } else if (response.responseText === "Success"){
                        updateButtonState(true);
                        resolve(true);
                    }
                    else if (response.responseText === "no exist") {
                        updateButtonState(false);
                        resolve(false);
                    }
                    else {
                        console.log("Error adding game.");
                        resolve(false);
                    }
                },
                onerror(error) {
                    console.error('Error adding game, details:', error);
                    reject(error);
                }
            });
        });
    }

    function updateButtonState(added) {
        if (added) {
            addGameButton.querySelector("span").innerHTML = "check_box";
            addGameButton.querySelector("p").style.background = "#4882a6";
            addGameButton.style.cursor = "not-allowed";
        } else {
            addGameButton.querySelector("p").style.background = "#58249c";
        }
    }
})();
