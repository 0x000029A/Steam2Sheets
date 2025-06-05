// ==UserScript==
// @name         Steam2Sheets
// @namespace    http://tampermonkey.net/
// @version      25.03.11
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

    const steamAppID = window.location.href.match(/\/app\/(\d+)\/?/)?.[1]; // Get the Steam AppID from the URL
    if (!steamAppID) return; // If no AppID found, exit

    // Get the button container
    const buttonContainer = await observeDOM('#queueActionsCtn'); // Wait for the button container to load
    if (!buttonContainer) return; // If no container found, exit

    const addGameButton = createAddGameButton(); // Create the button
    buttonContainer.insertBefore(addGameButton, buttonContainer.querySelector('div:nth-child(7)')); // Insert the button

    // Handle button click
    addGameButton.addEventListener('mousedown', handleButtonClick, { once: true });

    async function handleButtonClick() {
        const exists = await sendToGoogleApps(1);
        if (!exists) {
            console.log("Game does not exist, allowing addition.");
            addGameButton.addEventListener('mousedown', () => sendToGoogleApps(0), { once: true });
        }
    }

    function createAddGameButton() {
        const button = document.createElement('div');
        button.id = 'addGameButton';
        button.innerHTML = `<p><span class="material-symbols-outlined">check_box_outline_blank</span> Add Game</p>`;

        GM_addStyle(`
            @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&icon_names=check_box,check_box_outline_blank");

            #addGameButton {
                font-size: 15px;
                display: inline-block;
                cursor: pointer;
                user-select: none;
            }
            #addGameButton p {
                padding: 7px;
                color: #61bff7;
                background-color: #274157;
                border-radius: 2px;
            }
            #addGameButton p:hover {
                background-image: linear-gradient(to right, #66bff2, #427d9e);
                color: white;
            }
            .material-symbols-outlined {
                float: left;
                position: relative;
                bottom: 0.3rem;
            }
        `);
        return button;
    }

    function observeDOM(selector) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
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
                data: `key=KEY&check=${checkOnly}&id=${steamAppID}&src=1`,
                onload(response) {
                    const resText = response.responseText.trim();
                    console.log("Response:", resText);

                    if (resText === "exist") {
                        updateButtonState(true);
                        resolve(true);
                    } else if (resText === "no exist") {
                        updateButtonState(false);
                        resolve(false);
                    } else if (resText === "Steam AppID is not in IGDB") {
                        addGameButton.remove();
                        resolve(true);
                    } else if (resText === "Success") {
                        updateButtonState(true);
                        resolve(true);
                    } else {
                        resolve(true);
                    }
                },
                onerror(error) {
                    console.error('Error adding game:', error);
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
