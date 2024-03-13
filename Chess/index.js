const joinGame = document.getElementById("joinGame")
const joinGameClick = document.getElementById("joinClickArea")
const codeField = document.getElementById("codeField")
const createGame = document.getElementById("createGame")
const codeBox = document.getElementById("codeBox")
const codeCharSet = "ABCDEFGHJKLMNOPQRSTUVWXYZ1234567890"
const loading = '    <div id="loading">\
<div class="trapezium" id="tr0"></div>\
<div class="trapezium" id="tr1"></div>\
<div class="trapezium" id="tr2"></div>\
<div class="trapezium" id="tr3"></div>\
<div class="trapezium" id="tr4"></div>\
<div class="trapezium" id="tr5"></div>\
<div class="trapezium" id="tr6"></div>\
<div class="trapezium" id="tr7"></div>\
<div class="trapezium" id="tr8"></div>\
<div class="trapezium" id="tr9"></div>\
<div class="trapezium" id="tr10"></div>\
<div class="trapezium" id="tr11"></div>\
<div class="trapezium" id="tr12"></div>\
</div>'

function JoinGameHandler() {
    var response = JSON.parse(this.responseText)
    if (response.responseType == "NOGAMEFOUND") {
        IncorrectCode()
    } else {
        ResetCreateClick()
        ResetJoinClick()
        window.location.href = "https://chessarmies.com/play.html"
    }
}

function SendEnteredCode() { // sends the code entered into the code box to the server to request joining the corresponding game
    codeField.value = codeField.value.toUpperCase() // capitalises all letters
    codeField.value = codeField.value.replaceAll("O", "0") // replaces all "O" with "0"
    if (codeField.value.length == 8) { // checks the event is the correct length
        for (i = 0; i < 8; i++) {
            if (!codeCharSet.includes(codeField.value[i])) {
                IncorrectCode()
                return
            }
        }
        request = {
            requestType: "JOIN",
            gameCode: codeField.value,
        }
        var enterCodeReq = new XMLHttpRequest() // sets up the HTTPS request
        enterCodeReq.open("POST", "https://home.chessarmies.com:5072")
        enterCodeReq.withCredentials = true
        joinGameClick.innerHTML = loading
        joinGameClick.children[0].classList.add("lr")
        codeBox.classList.add("loadingPad")
        enterCodeReq.addEventListener("load", JoinGameHandler) // sets up event handlers for receiving the response from the server
        enterCodeReq.addEventListener("abort", IncorrectCode)
        enterCodeReq.addEventListener("error", IncorrectCode)
        enterCodeReq.send(JSON.stringify(request))
    } else {
        IncorrectCode() 
    }
}

function IncorrectCode() {
    joinGameClick.classList.add("incorrectCode")
    joinGame.style = "transition: none; background-color: transparent"
    setTimeout(function() {
        joinGame.style = ""
        joinGameClick.classList.remove("incorrectCode")
    },400)
    ResetJoinClick()
}

joinGameClick.onclick = function() {
    joinGameClick.onclick = function() {
        joinGameClick.onclick = null
        SendEnteredCode()
    }
    joinGame.classList.add("enterButtonClicked")
    codeBox.classList.remove("moveUp")
    // codeBox.classList.add("moveDown")
    // setTimeout(function() {
    //     codeBox.classList.remove("behind")
    //     },200)
}

codeField.onkeydown = function(keyboardEvent) {
    if (keyboardEvent.key == "Enter") {
        if (joinGameClick.onclick != null) {
            joinGameClick.onclick()
        }
    }
}

function ResetCreateClick() {
    createGame.innerHTML = '<h1 class="buttonTitle">Create a room</h1>'
    createGame.onclick = createGameOnclick 
}

function ResetJoinClick() {
    joinGameClick.innerHTML = '<h1 class="buttonTitle">Join a room</h1>'
    codeBox.classList.remove("loadingPad")
    joinGameClick.onclick = function() {
        joinGameClick.onclick = null
        SendEnteredCode()
    }
}

createGameOnclick = function() {
    createGame.innerHTML = loading
    createGame.children[0].classList.add("lc")
    createGame.onclick = null
    var joinGameReq = new XMLHttpRequest()
    joinGameReq.open("POST", "https://home.chessarmies.com:5072")
    joinGameReq.withCredentials = true
    joinGameReq.addEventListener("load", JoinGameHandler)
    joinGameReq.addEventListener("abort", ResetCreateClick)
    joinGameReq.addEventListener("error", ResetCreateClick)
    request = {
        requestType: "CREATE",
    }
    joinGameReq.send(JSON.stringify(request))
}

createGame.onclick = createGameOnclick