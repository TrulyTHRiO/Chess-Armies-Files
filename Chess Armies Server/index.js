// importing of modules
import { WebSocketServer } from 'ws'
import Crypto from 'crypto'
import { createServer } from 'https'
import { readFileSync } from 'fs'
import * as pieceClasses from './pieces.js'

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ" // extra letters are used for boards bigger than 8x8 to allow the code to be extended
const boardColours = "wbwbwbwbbwbwbwbwwbwbwbwbbwbwbwbwwbwbwbwbbwbwbwbwwbwbwbwbbwbwbwbw" // the order of the black and white tiles - can be changed to allow the order of the colours of board tiles to be changed at will for aesthetic purposes
const boardPieces = "rnbqkbnrpppppppp--------------------------------PPPPPPPPRNBQKBNR" // the order of the pieces on the board at the start of the game - can be changed to allow custom starting positions
const pieceTimer = 3000 // the timer for each piece - can be changed to change how long before each piece can be moved again
const boardSize = Math.sqrt(boardColours.length)
const port = 5072 

const options = { // sets the key and certificate for the SSL of the HTTPS server
    key: readFileSync('./SSL/private.key.pem'),
    cert: readFileSync('./SSL/domain.cert.pem'),
}

function CreateGameCookies(gameCode, UUID) { // creates the cookies to be sent to the client in the Set-Cookie header
    let parameters = "; secure; samesite=none; path=/; domain=chessarmies.com; max-age=" + 1*24*60*60
    return ["gameCode=" + gameCode + parameters, "UUID=" + UUID + parameters]
}

function ReqHandler(req, res) { // handles all incoming requests to the HTTPS server
    let requestData = ""
    req.on('data', chunk => {requestData += chunk.toString()}) // reconstructs the data sent to the server in the HTTPS POST request
    let cookiesObj = {}
    try {
        var cookiesArr = (req.headers.cookie.replaceAll(" ", "")).split(";")
        cookiesArr.forEach(function(element) {
            element = (element.replace("=", ";")).split(";") // split on only the first "="
            cookiesObj[element[0]] = element[1]
        })
    } catch {
        console.log("NO COOKIES")
    }
    req.on('end', () => {
        try {
            var parseData = JSON.parse(requestData)
        } catch {
            console.log("ERROR WITH POST REQUEST DATA")
        }
        try {
            switch (parseData.requestType) { // handles the data and creates or joins the corresponding room accordingly
                case "CREATE": {
                    var gameCode = CreateGame(UUID)
                    var UUID = CreateUUID()
                    JoinGame(gameCode, UUID, true)
                    var response = {
                        responseType: "JOINGAME",
                    }
                    break
                }
                case "JOIN": {
                    var gameCode = parseData.gameCode
                    var UUID = cookiesObj.UUID
                    if (gameRooms.find(room => room.gameCode == gameCode) != undefined) {
                        if (UUID == "undefined" || UUID == undefined) {
                            UUID = CreateUUID(gameCode)
                        } else {
                            UUID = CheckValidUUID(gameCode, cookiesObj.UUID)
                        }
                        if (UUID != cookiesObj.UUID) {
                            JoinGame(gameCode, UUID, false)
                        }
                        var response = {
                            responseType: "JOINGAME",
                        }
                        break
                    } else {
                        var response = {
                            responseType: "NOGAMEFOUND",
                        }
                    }
                    break
                }
            }
        } catch {
            console.log("ERROR WITH POST REQUEST parseData.requestType")
        }
        res.writeHead(200, {"Access-Control-Allow-Origin": "https://chessarmies.com", "Set-Cookie": CreateGameCookies(gameCode, UUID), "Access-Control-Allow-Credentials": "true", "Access-Control-Expose-Headers": "Set-Cookie","Access-Control-Allow-Headers": "*", "Connection": "close"}) // sets the cookies on the client for the game that they have joined
        res.end(JSON.stringify(response))
    })
}

var serv = createServer(options, ReqHandler)
serv.listen(port)


const serverInstance = new WebSocketServer({ server: serv })
console.log("WEBSOCKETSERVER INSTANCE:")
console.log(serverInstance)
console.log("HTTPS SERVER INSTANCE: ")
console.log(serv)
const codeCharSet = "ABCDEFGHJKLMNPQRSTUVWXYZ1234567890"
var gameRooms = []

class game {

    constructor(gameCode) {
        this.gameCode = gameCode
    }

    players = []
    teamNone = []
    team1 = []
    team2 = []
    gameState = "joining"
    boardArr = GenerateBoard()

}

class player {

    constructor(UUID, host) {
        this.UUID = UUID
        this.host = host
    }

    client = undefined
    nickname = undefined
    team = undefined
}

function GenerateBoard() { // creates a new array of pieces in accordance with the size of the chessboard and calls the PopulateBoard function to populate the array with the pieces corresponding to the boardPieces constant
    let boardArr = new Array(boardSize)
    for (let i = 0; i < boardSize; i++) {
        boardArr[i] = new Array(boardSize)
    }
    boardArr = PopulateBoard(boardArr)
    return boardArr
}

function PopulateBoard(boardArr) { // calls the CreatePiece function for every piece, creating all the pieces on the board, and adding them to the array of pieces (boardArr)
    for (let i1 = 0; i1 < boardSize; i1++) {
        for (let i2 = 0; i2 < boardSize; i2++) {
            let pos = [alphabet[i2],(boardSize-i1)]
            boardArr[i2][boardSize-i1-1] = CreatePiece(boardPieces[i1*boardSize+i2], pos)
        }
    }
    return boardArr
}

function CreatePiece(piece, tile) { // creates a new piece object given a letter and a position on the chessboard
    let col
    if (piece == piece.toLowerCase()) {
        col = "b"
    } else {
        col = "w"
    }
    piece = piece.toLowerCase()
    switch (piece) {
        case "r":
            return new pieceClasses.rook(tile, col)
        case "n":
            return new pieceClasses.knight(tile, col)
        case "b":
            return new pieceClasses.bishop(tile, col)
        case "q":
            return new pieceClasses.queen(tile, col)
        case "k":
            return new pieceClasses.king(tile, col)
        case "p":
            return new pieceClasses.pawn(tile, col)
        case "-":
            return null
    }
}


function GenerateCode() { // generates a unique code for the game room
    let code = ""
    for (let i = 0; i < 8; i++) {
        code += codeCharSet[Math.floor(Math.random() * codeCharSet.length)]
    }
    if (gameRooms.find(room => room.gameCode == code) != undefined) {
        return GenerateCode()
    } else {
        return code
    }
}

function CreateUUID(gameCode) { // uses the NPM module Crypto to create a unique identifier the player
    let UUID = Crypto.randomUUID()
    if (typeof gameCode != "undefined") {
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID) != undefined) {
            UUID = CreateUUID(gameCode)
        }
    }

    return UUID
}

function CheckValidUUID(gameCode, UUID) { // checks whether a UUID is already used by another player within the game of the specifed code
    if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID) == undefined) {
        return CreateUUID(gameCode)
    } else {
        return UUID
    }
}

function CreateGame(UUID) { // creates the code for the new game and calls the InitialiseGameRoom function, creating the game object using the newly created code
    let gameCode = GenerateCode()
    InitialiseGameRoom(gameCode)
    return gameCode
}

function InitialiseGameRoom(gameCode) { // adds the new game object to the array of games and sets the timer for it to be deleted after 24 hours
    let gameObject = new game(gameCode)
    gameRooms.push(gameObject)
    setTimeout(DeleteGameRoom.bind(undefined, gameCode), 1*24*60*60*1000)
}

function DeleteGameRoom(gameCode) { // deletes a game room from the array of game rooms
    gameRooms.splice(gameRooms.find(room => room.gameCode == gameCode),1)
}

function JoinGame(gameCode, UUID, host) { // adds the new player to the game they requested to join
    gameRooms.find(room => room.gameCode == gameCode).players.push(new player(UUID, host))
}

function AssignClient(client, gameCode, UUID) { // assigns the newly connected client to the player object that corresponds to their UUID
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID) != undefined)) {
        (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID).client = client
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID).nickname != undefined) {
            let response = {
                responseType: "PLAYERNICKNAME",
                nickname: (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID).nickname,
            }
            client.send(JSON.stringify(response))
        }
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.UUID == UUID).host) {
            let response = {
                responseType: "ASSIGNHOST",
            }
            client.send(JSON.stringify(response))
        }
    }
}

function SendGame(client, gameCode) { // sends the newly connected client the current board state so that it can recreate the game locally
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined)) {
        var response = {
            responseType: "GAMEOBJECT",
            boardArr: (gameRooms.find(room => room.gameCode == gameCode)).boardArr,
            team1: (gameRooms.find(room => room.gameCode == gameCode)).team1,
            team2: (gameRooms.find(room => room.gameCode == gameCode)).team2,
            gameState: (gameRooms.find(room => room.gameCode == gameCode)).gameState,
            timeOfObj: Date.now(),
        }
    } else {
        var response = {
            responseType: "NOGAMEFOUND",
        }
    }
    client.send(JSON.stringify(response))
}

function UpdateNickname(client, gameCode, nickname) { // updates the nickname attribute of a player object
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined)) {
        if (nickname == "") {
            nickname = "Player " + (gameRooms.find(room => room.gameCode == gameCode).players).indexOf((gameRooms.find(room => room.gameCode == gameCode).players.find(player => player.client == client)))
        }
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.nickname == nickname) == undefined) { // nickname can only be set once
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).nickname == undefined) { // nicknames must be unique
                (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).nickname = nickname
                var response = {
                    responseType: "NICKNAMESET",
                    nickname: nickname,
                }
            } else {
                var response = {
                    responseType: "INVALIDNICKNAME",
                }
            }
        } else {
            return
        }
        client.send(JSON.stringify(response))
    }
}

function AddToTeam(client, gameCode, team) { // adds a player to the requested team and informs all client of the change
    if ((team == "joinTeam1" || team == "joinTeam2") && ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined))) {
        if (gameRooms.find(room => room.gameCode == gameCode).gameState == "joining") {
            let nickname = ((gameRooms.find(room => room.gameCode == gameCode)).players).find(player => player.client == client).nickname
            if (nickname == undefined) {
                let response = {
                    responseType: "NONICKNAMESET",
                }
                client.send(JSON.stringify(response))
                return
            }
            let oldTeam = ((gameRooms.find(room => room.gameCode == gameCode)).players).find(player => player.client == client).team
            if (oldTeam == team) {
                return
            }
            if (oldTeam == "joinTeam1") {
                (gameRooms.find(room => room.gameCode == gameCode)).team1.splice((gameRooms.find(room => room.gameCode == gameCode)).team1.indexOf(nickname),1);
                (gameRooms.find(room => room.gameCode == gameCode)).team2.push(nickname)
            } else if (oldTeam == "joinTeam2") {
                (gameRooms.find(room => room.gameCode == gameCode)).team2.splice((gameRooms.find(room => room.gameCode == gameCode)).team2.indexOf(nickname),1);
                (gameRooms.find(room => room.gameCode == gameCode)).team1.push(nickname)
            } else if (team == "joinTeam1") {
                (gameRooms.find(room => room.gameCode == gameCode)).team1.push(nickname)
            } else {
                (gameRooms.find(room => room.gameCode == gameCode)).team2.push(nickname)
            }
            ((gameRooms.find(room => room.gameCode == gameCode)).players).find(player => player.client == client).team = team
            let responseAll = {
                responseType: "TEAMCHANGE",
                nickname: nickname,
                oldTeam: oldTeam,
                team: team,
            }
            InformClients(gameCode, responseAll)
        }
    }
}

function StartPieceAssignment(client, gameCode) { // advances the game to the "assigning" stage, where teams can no longer be changed and pieces can now be chosen
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined) && (gameRooms.find(room => room.gameCode == gameCode).gameState == "joining") && (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).host == true) {
        gameRooms.find(room => room.gameCode == gameCode).gameState = "assigning"
        let responseAll = {
            responseType: "STARTPIECEASSIGNMENT"
        }
        InformClients(gameCode, responseAll)
    }
}

function AssignPiece(client, gameCode, piece) { // assigns an unowned piece to the player who requested its ownership if on the correct team
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined) && (gameRooms.find(room => room.gameCode == gameCode).gameState == "assigning")) {
        if ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).team != undefined) {
            let col = ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).team == "joinTeam1" ? "w" : "b")
            try {
                if (gameRooms.find(room => room.gameCode == gameCode).boardArr[alphabet.indexOf(piece[0])][piece[1]-1].owner == "" && gameRooms.find(room => room.gameCode == gameCode).boardArr[alphabet.indexOf(piece[0])][piece[1]-1].colour == col) {
                    gameRooms.find(room => room.gameCode == gameCode).boardArr[alphabet.indexOf(piece[0])][piece[1]-1].owner = (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).nickname
                    let responseAll = {
                        responseType: "ASSIGNPIECE",
                        nickname: (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).nickname,
                        piece: piece,
                    }
                    InformClients(gameCode, responseAll)
                }
            } catch {
                console.error("BAD PIECE ARRAY")
            } 
        }
    }

}

function StartGamePlay(client, gameCode) { // advances the game to the "playing" stage, where pieces can no longer be chosen and can now be moved by their owner
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined) && (gameRooms.find(room => room.gameCode == gameCode).gameState == "assigning") && (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).host == true) {
        gameRooms.find(room => room.gameCode == gameCode).gameState = "playing"
        let responseAll = {
            responseType: "STARTGAMEPLAY"
        }
        InformClients(gameCode, responseAll)
    }
}

function MovePiece(client, gameCode, posFrom, posTo) { // checks whether a move is legal, if so, makes the move, and informs all clients of the move made
    if ((gameRooms.find(room => room.gameCode == gameCode) != undefined) && ((gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client) != undefined) && (gameRooms.find(room => room.gameCode == gameCode).gameState == "playing")) {
        let boardArr = (gameRooms.find(room => room.gameCode == gameCode)).boardArr
        if (boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1] && boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1].turnMovable) {
            let validatedMove = boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1].ValidateMove(posTo, boardArr)
            if ((validatedMove > 0) && boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1].owner == (gameRooms.find(room => room.gameCode == gameCode).players).find(player => player.client == client).nickname) {
                let responseAll = {
                    responseType: "MOVEPIECE",
                    from: posFrom,
                    to: posTo,
                }
                if (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] instanceof pieceClasses.king) {
                    responseAll.responseType = "GAMEOVER"
                    responseAll.loser = boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour
                    gameRooms.find(room => room.gameCode == gameCode).gameState = "over"
                }
                if (typeof validatedMove == "number") {
                    responseAll.rookDistance = validatedMove;
                    (gameRooms.find(room => room.gameCode == gameCode)).boardArr = boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1].Castle(validatedMove, posTo, boardArr, pieceTimer)
                } else {
                    boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1].pos = posTo;
                    (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] = boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1];
                    (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posFrom[0])][posFrom[1]-1] = null
                    if ((gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] instanceof pieceClasses.pawn && (posTo[1] == 1 || posTo[1] == boardSize)) {
                        (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].ValidateMove = (new pieceClasses.queen).ValidateMove;
                        (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].type = "Q";
                        (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].img = (new pieceClasses.queen(undefined, (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour))).img;
                        (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] = Object.assign(new pieceClasses.queen, (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1])
                    }
                    (gameRooms.find(room => room.gameCode == gameCode)).boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].SetTimer(pieceTimer)
                }
                InformClients(gameCode, responseAll)
            } else {
                let response = {
                    responseType: "INVALIDMOVE",
                }
                client.send(JSON.stringify(response))
            }
        }
    }
}

function InformClients(gameCode, response) { // sends a JSON "resposnse" object to all clients connected to the websocket
    (gameRooms.find(room => room.gameCode == gameCode)).players.forEach(function(player) {
        if (typeof player.client != "undefined") {
            player.client.send(JSON.stringify(response))
        }
    })
}

serverInstance.on('listening', function listening() {
    console.log("WEBSOCKETSERVER LISTENING")
})

serverInstance.on('connection', function connection(client) { // on a client connecting to the server, sets up the event listener to handle any sent data

    // client.on('error', console.error)

    client.on('close', () => console.log("good riddance"))

    client.on('message', function message(data) { // handles data sent to the server
        try {
            var parseData = JSON.parse(data)
        } catch {
            console.log("ERROR WITH WSS REQUEST DATA")
            return
        }
        try {
            switch (parseData.requestType) {
                case "ASSIGNCLIENT": {
                    let UUID = parseData.UUID
                    let gameCode = parseData.gameCode
                    if (UUID != undefined && gameCode != undefined) {
                        AssignClient(client, gameCode, UUID)
                    }
                    break
                }
                case "REQUESTGAMEOBJECT": {
                    let gameCode = parseData.gameCode
                    if (gameCode != undefined) {
                        SendGame(client, gameCode)
                    }
                    break
                }
                case "UPDATENICKNAME": {
                    let gameCode = parseData.gameCode
                    let nickname = parseData.nickname
                    if (gameCode != undefined && typeof nickname == "string") {
                        UpdateNickname(client, gameCode, nickname.replaceAll(" ", ""))
                    }
                    break
                }
                case "JOINTEAM": {
                    let gameCode = parseData.gameCode
                    let team = parseData.team
                    if (team != undefined && gameCode != undefined) {
                        AddToTeam(client, gameCode, team)
                    }
                    break
                }
                case "STARTPIECEASSIGNMENT": {
                    let gameCode = parseData.gameCode
                    if (gameCode != undefined) {
                        StartPieceAssignment(client, gameCode)
                    }
                    break
                }
                case "REQUESTPIECE": {
                    let gameCode = parseData.gameCode
                    let piece = parseData.piece
                    if (gameCode != undefined) {
                        AssignPiece(client, gameCode, piece)
                    }
                    break
                }
                case "STARTGAMEPLAY": {
                    let gameCode = parseData.gameCode
                    if (gameCode != undefined) {
                        StartGamePlay(client, gameCode)
                    }
                    break
                }
                case "MOVEPIECE": {
                    let gameCode = parseData.gameCode
                    let posFrom = parseData.from
                    let posTo = parseData.to
                    if (gameCode != undefined) {
                        MovePiece(client, gameCode, posFrom, posTo)
                    }
                    break
                }
            }
        } catch {
            console.log("ERROR WITH WSS REQUEST parseData.requestType")
        }
    })

    })
