// ==UserScript==
// @name         IGDB2Sheets
// @namespace    http://tampermonkey.net/
// @version      24.11.13
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

    const IGDBID_elm = await observeDOM("div.sc-eIPYkq.ioJrei.MuiGrid2-root.MuiGrid2-direction-xs-row.sc-hBgdUx.jLxKaX.sc-kxJlZZ.hytsjV > div > div.sc-eIPYkq.jILOUz.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.MuiGrid2-grid-md-3.sc-hBgdUx.jLxKaX > div > div:nth-child(1) > div > p");
    const IGDBID = IGDBID_elm.innerText.match(/IGDB ID: (.*)/)[1];

    if (IGDBID) {
        var addGameBtnDiv = createAddGameBtnDiv();
        const parentDiv = await observeDOM("div.sc-eIPYkq.ioJrei.MuiGrid2-root.MuiGrid2-direction-xs-row.sc-hBgdUx.jLxKaX.sc-gopctv.jyBCHy > div.sc-eIPYkq.kyMHnR.MuiGrid2-root.MuiGrid2-container.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.sc-hBgdUx.jLxKaX.sc-hsnvOV > div > div > div.sc-eIPYkq.hWuoFC.MuiGrid2-root.MuiGrid2-container.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.sc-hBgdUx.jLxKaX > div.sc-eIPYkq.bPysV.MuiGrid2-root.MuiGrid2-direction-xs-row.MuiGrid2-grid-xs-12.MuiGrid2-grid-sm-6.MuiGrid2-grid-md-3.sc-hBgdUx.jLxKaX.sc-jNksTS.sc-jKsysk.kBHwDp.hwizCH");
        parentDiv.appendChild(addGameBtnDiv);
        if (await googleApps(1)) return;
        addGameBtnDiv.addEventListener('mousedown', () => googleApps(0), {once: true});
    }
    ////////////////////////
    function createAddGameBtnDiv() {
        const addGameBtnDiv__ = document.createElement('div');
        addGameBtnDiv__.setAttribute("id", "addGameBtnDiv");
        addGameBtnDiv__.innerHTML = `<p><span class="material-symbols-outlined">check_box_outline_blank</span>Add Game</p>`;

        GM_addStyle(`
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&icon_names=check_box,check_box_outline_blank");

        #addGameBtnDiv {
        width: 100%;
        background-color: #40414c;
        padding-top: 4%;
        padding-bottom: 2%;
        border-radius: 4px;
        user-select:none;
        cursor:pointer;
        }

        #addGameBtnDiv p {
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

        return addGameBtnDiv__;
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
    function googleApps(checkOnly) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'webapp_url',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                data: `check=${checkOnly}&id=${IGDBID}&src=0`,
                onload: function(response) {
                    if (response.responseText === "exist") {
                        addGameBtnDiv.querySelector("span").innerHTML = "check_box";
                        addGameBtnDiv.querySelector("p").style.background = "#4882a6";
                        addGameBtnDiv.style.cursor = "not-allowed";
                        resolve(true);
                    } else if (response.responseText === "Success"){
                        addGameBtnDiv.querySelector("span").innerHTML = "check_box";
                        addGameBtnDiv.querySelector("p").style.background = "#4882a6";
                        addGameBtnDiv.style.cursor = "not-allowed";
                        addGameBtnDiv.removeEventListener('mousedown', googleApps);
                    }
                    else if (response.responseText === "no exist") {
                        addGameBtnDiv.querySelector("p").style.background = "#58249c";
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