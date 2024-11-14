// ==UserScript==
// @name         Steam2Sheets
// @namespace    http://tampermonkey.net/
// @version      24.11.13
// @description  Add Steam games to Google Sheets.
// @author       mHashem
// @match        https://store.steampowered.com/app/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @tag          automation
// ==/UserScript==

(async function() {
    'use strict';

    const steamID = window.location.href.match(/\/app\/(\d+)\//)[1];

    if (steamID) {
        var addGameBtnDiv = createAddGameBtnDiv();
        const parentDiv = await observeDOM('#queueActionsCtn');
        parentDiv.insertBefore(addGameBtnDiv, parentDiv.querySelector('div:nth-child(7)'));
        if (await googleApps(1)) return;
        else addGameBtnDiv.addEventListener('mousedown', () => googleApps(0), {once: true});
    }
    ///////////////////////
    function createAddGameBtnDiv() {
        const addGameBtnDiv__ = document.createElement('div');
        addGameBtnDiv__.id = 'addGameBtnDiv';
        addGameBtnDiv__.innerHTML = `<p><span class="material-symbols-outlined">check_box_outline_blank</span>Add Game</p>`;

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
            #addGameBtnDiv p {
            padding: 7px;
            color: #61bff7;
            background-color: #274157;
            border-radius: 2px;
            }
            #addGameBtnDiv p:hover {
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
        console.log("Check only sent" + checkOnly);
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'POST',
                url: 'webapp_url',
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                data: `check=${checkOnly}&id=${steamID}&src=1`,
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
                    else if (response.responseText === "Steam AppID is not in IGDB") {
                        addGameBtnDiv.remove();
                    }
                    else {
                        console.log(response.responseText);
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