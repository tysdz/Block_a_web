var WebsiteUrl;
var WebsiteHostName;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    WebsiteUrl = tabs[0].url
    WebsiteHostName = new URL(tabs[0].url).hostname

    document.getElementById("url").innerText = WebsiteHostName
})

function ShowError(text) {
    var div = document.createElement('div');
    div.setAttribute('id', 'ERRORcontainer');
    div.innerHTML = `
                <div class="ERROR">
                    <p>${text}</p>     
                </div>`
    document.getElementsByClassName("bottomItem")[0].appendChild(div)

    setTimeout(() => {
        document.getElementById("ERRORcontainer").remove()
    }, 3000)
}

document.getElementById("btn").addEventListener("click", () => {

    if (WebsiteUrl.toLowerCase().includes("chrome://")) {
        ShowError("You cannot block a chrome URL")
    }
    else {
        chrome.storage.local.get("BlockedUrls", (data) => {
            if (data.BlockedUrls === undefined) {
                chrome.storage.local.set({ BlockedUrls: [{ status: "In_Progress", url: WebsiteHostName }] })
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { from: "popup", subject: "startTimer" }
                    );
                });

                setTimeout(() => {
                    var then = new Date();
                    then.setHours(24, 0, 0, 0);
                    const blockTill = then.getTime()

                    chrome.storage.local.set({
                        BlockedUrls: [{
                            status: "BLOCKED", url: WebsiteHostName, BlockTill: blockTill
                        }]
                    })
                }, 5000);

            }
            else {
                if (data.BlockedUrls.some((e) => e.url === WebsiteHostName && e.status === "In_Progress")) {
                    ShowError("This URL will be completely blocked after some time")
                }
                else if (data.BlockedUrls.some((e) => e.url === WebsiteHostName && e.status === "BLOCKED")) {
                    ShowError("This URL is Blocked completely")
                }
                else {
                    chrome.storage.local.set({ BlockedUrls: [...data.BlockedUrls, { status: "In_Progress", url: WebsiteHostName }] })

                    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                        chrome.tabs.sendMessage(
                            tabs[0].id,
                            { from: "popup", subject: "startTimer" }
                        );
                    });

                    setTimeout(() => {
                        chrome.storge.local.get("BlockedUrls", (data) => {
                            data.BlockedUrls.forEach((e, index) => {
                                if (e.url === WebsiteHostName && e.status === 'In_Progress') {
                                    var arr = data.BlockedUrls.splice(index, 1);

                                    var then = new Date();
                                    then.setHours(24, 0, 0, 0);
                                    const blockTill = then.getTime()

                                    chrome.storage.local.set({ BlockedUrls: [...arr, { status: "BLOCKED", url: WebsiteHostName, BlockTill: blockTill }] })
                                }
                            })
                        })
                    }, 5000);
                }
            }
        })
    }
})

// Variable declarations
var WebsiteUrl;
var WebsiteHostName;
var countdownInterval;

// Get the active tab URL and hostname
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    WebsiteUrl = tabs[0].url;
    WebsiteHostName = new URL(tabs[0].url).hostname;

    document.getElementById("url").innerText = WebsiteHostName;

    // Retrieve countdown time from storage and start countdown if available
    chrome.storage.local.get("CountdownTimes", (data) => {
        if (data.CountdownTimes && data.CountdownTimes[WebsiteHostName]) {
            var countdownTime = data.CountdownTimes[WebsiteHostName];
            var currentTime = new Date().getTime();
            var remainingTime = countdownTime - currentTime;

            if (remainingTime > 0) {
                startCountdown(remainingTime);
            } else {
                // Countdown time has expired, block the website
                blockWebsite();
            }
        }
    });
});

// Function to show an error message
function ShowError(text) {
    var div = document.createElement('div');
    div.setAttribute('id', 'ERRORcontainer');
    div.innerHTML = `
        <div class="ERROR">
            <p>${text}</p>     
        </div>`;
    document.getElementsByClassName("bottomItem")[0].appendChild(div);

    setTimeout(() => {
        document.getElementById("ERRORcontainer").remove();
    }, 3000);
}

// Function to start the countdown timer
function startCountdown(time) {
    var remainingTime = time;
    countdownInterval = setInterval(() => {
        var minutes = Math.floor(remainingTime / 60000);
        var seconds = Math.floor((remainingTime % 60000) / 1000);

        document.getElementById("time").innerText = `${minutes}m ${seconds}s`;

        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            document.getElementById("time").innerText = "Time's up!";
            blockWebsite();
        }

        remainingTime -= 1000;
    }, 1000);
}

// Function to block the website
function blockWebsite() {
    chrome.storage.local.get("BlockedUrls", (data) => {
        if (data.BlockedUrls === undefined) {
            chrome.storage.local.set({ BlockedUrls: [{ status: "BLOCKED", url: WebsiteHostName }] });
        } else {
            var existingUrls = data.BlockedUrls.map((e) => e.url);
            if (!existingUrls.includes(WebsiteHostName)) {
                chrome.storage.local.set({ BlockedUrls: [...data.BlockedUrls, { status: "BLOCKED", url: WebsiteHostName }] });
            }
        }
    });
}

// Event listener for "BLOCK URL NOW" button click
document.getElementById("btn").addEventListener("click", () => {
    if (WebsiteUrl.toLowerCase().includes("chrome://")) {
        ShowError("You cannot block a Chrome URL");
    } else {
        ShowError("The website will be blocked after 5 seconds");
        setTimeout(blockWebsite, 5000);
    }
});

// Event listener for "BLOCK URL AFTER 15 MIN" button click
document.getElementById("btn1").addEventListener("click", () => {
    if (WebsiteUrl.toLowerCase().includes("chrome://")) {
        ShowError("You cannot block a Chrome URL");
    } else {
        chrome.storage.local.get("BlockedUrls", (data) => {
            var existingUrls = data.BlockedUrls ? data.BlockedUrls.map((e) => e.url) : [];
            if (!existingUrls.includes(WebsiteHostName)) {
                var currentTime = new Date().getTime();
                var blockTillTime = currentTime + 15 * 60 * 1000; // Add 15 minutes in milliseconds

                startCountdown(blockTillTime - currentTime);

                // Store the countdown time in storage for the current website
                chrome.storage.local.get("CountdownTimes", (data) => {
                    var countdownTimes = data.CountdownTimes || {};
                    countdownTimes[WebsiteHostName] = blockTillTime;
                    chrome.storage.local.set({ CountdownTimes: countdownTimes });
                });
            } else {
                ShowError("This URL is already blocked");
            }
        });
    }
});
