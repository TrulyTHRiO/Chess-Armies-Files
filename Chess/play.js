function GetCookies() { // gets stored cookies
    let cookies = document.cookie
    let splitCookies = cookies.split("; ")
    var parseCookies = {}
    splitCookies.forEach(function(element) {
        element = (element.replace("=", ";")).split(";") // split on only the first "="
        parseCookies[element[0]] = element[1]
    })
    return parseCookies
}


{
    var cookies = GetCookies()
    var UUID = cookies.UUID
    var gameCode = cookies.gameCode
    if (UUID == undefined || gameCode == undefined) {
        window.location.href = "https://chessarmies.com/"
    } else {
        document.getElementById("code").innerHTML = gameCode
        var sendReq = true
    }
}

function RequestGame() {
    let request = {
        requestType: "REQUESTGAMEOBJECT",
        gameCode: gameCode,
    }
    server.send(JSON.stringify(request))
}

document.getElementById("joinTeam1").onclick = document.getElementById("joinTeam2").onclick = function() {
    if (gameState == "joining") {
        let request = {
            requestType: "JOINTEAM",
            gameCode: gameCode,
            team: this.id,
        }
        server.send(JSON.stringify(request))
    }
}

document.getElementById("submitNickname").onclick = function() {
    let request = {
        requestType: "UPDATENICKNAME",
        gameCode: gameCode,
        nickname: document.getElementById("nicknameField").value,
    }
    server.send(JSON.stringify(request))
}

document.getElementById("nicknameField").onkeydown = function(keyboardEvent) {
    if (keyboardEvent.key == "Enter") {
        document.getElementById("submitNickname").onclick()
    }
}

document.getElementById("startGameButton").onclick = function() {
    let request = {
        requestType: "STARTPIECEASSIGNMENT",
        gameCode: gameCode,
    }
    server.send(JSON.stringify(request))
}

function StartPieceAssignment(retroactive) { // allows the pieces to be clicked to request their ownership
    if (typeof playerTeam != "undefined") {
        let col = (playerTeam == "team1" ? "w" : "b")
        document.querySelectorAll(".tile").forEach(function(tile) {
            let tileID = tile.id.split(",")
            if (boardArr[alphabet.indexOf(tileID[0])][tileID[1]-1] && boardArr[alphabet.indexOf(tileID[0])][tileID[1]-1].colour == col) {
                tile.onclick = function() {
                    let request = {
                        requestType: "REQUESTPIECE",
                        gameCode: gameCode,
                        piece: tileID,
                    }
                    server.send(JSON.stringify(request))
                }
            }
        })
    }
    if (retroactive) { // colours the pieces retroactively if the page is loaded part-way through the piece assignment
        document.querySelectorAll(".tile").forEach(function(tile) {
            let tileID = tile.id.split(",")
            if (boardArr[alphabet.indexOf(tileID[0])][tileID[1]-1]) {
                let owner = boardArr[alphabet.indexOf(tileID[0])][tileID[1]-1].owner
                if (owner != "") {
                    if (typeof playerNickname == "string" && owner == playerNickname) {
                        document.getElementById(tile.id).classList.add("owned")
                    } else {
                        document.getElementById(tile.id).classList.add("unowned")
                    }
                }
            }
        })
    }
}

function StartGamePlay(retroactive, timeOfObj) { // allows the pieces to be moved
    if (typeof playerTeam != "undefined") {
        let divs = document.querySelectorAll(".tile")
        divs.forEach(function(div) {
            div.onclick = DivsOnClickRequest
        })
    
    }
    if (!retroactive) { // removes the colours added to the pieces during the assignment stage
        document.querySelectorAll(".tile").forEach(function(tile) {
            document.getElementById(tile.id).classList.remove("owned")
            document.getElementById(tile.id).classList.remove("unowned")
        })
    } else {
        boardArr.forEach(function(dimension, i1) {
            dimension.forEach(function(individual, i2) {
                if (individual && individual.turnMovable == false) {
                    if (pieceTimer - (timeOfObj - individual.lastMoved) > 0) {
                        boardArr[i1][i2].SetTimer(pieceTimer - (timeOfObj - individual.lastMoved))
                    }
                }
            })
        })
    }
}

server.onopen = function(event) { // on connecting to the server, sets up the event listener to handle any received data 
    if (sendReq == true) {
        let request = {
            requestType: "ASSIGNCLIENT",
            UUID: UUID,
            gameCode: gameCode,
        }
        server.send(JSON.stringify(request))
        RequestGame()
    }
    server.onmessage = function(data) { // handles data received from the server
        let parseData = JSON.parse(data.data)
        switch (parseData.responseType) {
            case "GAMEOBJECT": {
                boardArr = parseData.boardArr
                boardArr.forEach(function(dimension, i1) {
                    dimension.forEach(function(individual, i2) {
                        if (boardArr[i1][i2]) {
                            boardArr[i1][i2] = Object.assign(CreatePiece(individual.type), boardArr[i1][i2])
                        }
                    })
                })
                gameState = parseData.gameState
                CreateTiles("w")
                let team1 = parseData.team1
                team1.forEach(function(nickname){
                    let nameDOM = document.createElement("p")
                    nameDOM.id = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                    nameDOM.innerHTML = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                    nameDOM.classList.add("nickname")
                    document.getElementById("team1").appendChild(nameDOM)
                })
                let team2 = parseData.team2
                team2.forEach(function(nickname){
                    let nameDOM = document.createElement("p")
                    nameDOM.id = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                    nameDOM.innerHTML = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                    nameDOM.classList.add("nickname")
                    document.getElementById("team2").appendChild(nameDOM)
                })
                if (typeof playerNickname == "string" && team2.includes(playerNickname)) {
                    playerTeam = "team2"
                    let divs = document.querySelectorAll(".tile")
                    document.getElementById("board").classList.add("rot")
                    for (let i = 0; i < divs.length; ++i) {
                        divs[i].classList.add("rot")
                    }
                } else {
                    playerTeam = "team1"
                }
                if (gameState == "assigning") {
                    document.getElementById("startGameButton").innerHTML = "START 2.0!"
                    document.getElementById("startGameButton").onclick = function() {
                        let request = {
                            requestType: "STARTGAMEPLAY",
                            gameCode: gameCode,
                        }
                        server.send(JSON.stringify(request))
    
                    }
                    StartPieceAssignment(true)
                } else if (gameState == "playing") {
                    let timeOfObj = parseData.timeOfObj
                    document.getElementById("startGameButton").style = "display: none"
                    document.getElementById("startGameButton").onclick = null
                    StartGamePlay(true, timeOfObj)
                } else if (gameState == "over") {
                    document.getElementById("startGameButton").style = "display: none"
                    document.getElementById("startGameButton").onclick = null
                }
                break
            }
            case "TEAMCHANGE": {
                let nickname = parseData.nickname
                let team = (parseData.team == "joinTeam1" ? "team1" : "team2")
                let oldTeam = parseData.oldTeam
                if (oldTeam != undefined) {
                    document.getElementById(nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")).remove()
                }
                let nameDOM = document.createElement("p")
                nameDOM.id = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                nameDOM.innerHTML = nickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt")
                nameDOM.classList.add("nickname")
                document.getElementById(team).appendChild(nameDOM)
                if (typeof playerNickname == "string" && nickname == playerNickname) {
                    let divs = document.querySelectorAll(".tile")
                    if (team == "team1") {
                        document.getElementById("board").classList.remove("rot")
                        for (let i = 0; i < divs.length; ++i) {
                            divs[i].classList.remove("rot")
                        }
                        playerTeam = "team1"
                    } else {
                        document.getElementById("board").classList.add("rot")
                        for (let i = 0; i < divs.length; ++i) {
                            divs[i].classList.add("rot")
                        }
                        playerTeam = "team2"
                    }
                }
                break
            }
            case "NICKNAMESET": {
                playerNickname = parseData.nickname
                document.getElementById("code").innerHTML += " (" + playerNickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt") + ")"
                document.getElementById("nicknamePopup").style = "display: none"
                document.getElementById("boardContainer").style = ""
                break
            }
            case "PLAYERNICKNAME": {
                playerNickname = parseData.nickname
                document.getElementById("code").innerHTML += " (" + playerNickname.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(">", "&gt") + ")"
                document.getElementById("nicknamePopup").style = "display: none"
                document.getElementById("boardContainer").style = ""
                break
            }
            case "INVALIDNICKNAME": {
                document.getElementById("enterNickname").innerHTML = "INVALID NICKNAME"
                break
            }
            case "ASSIGNHOST": {
                document.getElementById("startGameButton").style = ""
                document.getElementsByClassName("")
                break
            }
            case "STARTPIECEASSIGNMENT": {
                gameState = "assigning"
                StartPieceAssignment(false)
                document.getElementById("startGameButton").innerHTML = "START 2.0!"
                document.getElementById("startGameButton").onclick = function() {
                    let request = {
                        requestType: "STARTGAMEPLAY",
                        gameCode: gameCode,
                    }
                    server.send(JSON.stringify(request))

                }
                break
            }
            case "STARTGAMEPLAY": {
                gameState = "playing"
                StartGamePlay(false)
                document.getElementById("startGameButton").style = "display: none"
                document.getElementById("startGameButton").onclick = null
                break
            }
            case "ASSIGNPIECE": {
                let nickname = parseData.nickname
                let piece = parseData.piece
                if (nickname == playerNickname) {
                    document.getElementById(piece.toString()).classList.add("owned")
                } else {
                    document.getElementById(piece.toString()).classList.add("unowned")
                }
                boardArr[alphabet.indexOf(piece[0])][piece[1]-1].owner = nickname
                break
            }
            case "MOVEPIECE": {
                let piece = boardArr[alphabet.indexOf(parseData.from[0])][parseData.from[1]-1]
                let posTo = parseData.to
                let rookDistance = parseData.rookDistance
                MovePiece(piece, posTo, rookDistance)
                break
            }
            case "GAMEOVER": {
                gameState = "over"
                let piece = boardArr[alphabet.indexOf(parseData.from[0])][parseData.from[1]-1]
                let posTo = parseData.to
                MovePiece(piece, posTo, undefined)
                break
            }
        }
    }
}
