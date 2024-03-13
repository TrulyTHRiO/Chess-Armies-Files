const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ"

class piece {

    constructor(tile, colour) {
        this.pos = tile
        this.colour = colour
    }

    turnMovable = true
    lastMoved = undefined
    owner = ""
    moved = false

    SetTimer(time) {
        this.moved = true
        this.turnMovable = false
        this.lastMoved = Date.now()
        setTimeout(this.SetTurnMovable, time, this)
    }

    SetTurnMovable(piece) {
        piece.turnMovable = true;
    }
    
}

class rook extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-rook.png" : "black-rook.png")
    }

    moved = false
    type = "R"

    ValidateMove(posTo, boardArr) {
        if (((this.pos[0] == posTo[0]) && (this.pos[1] != posTo[1]) || (this.pos[0] != posTo[0]) && (this.pos[1] == posTo[1])) && (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null ? true : boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour != this.colour)) {
            for (let i = 1; i < Math.abs(this.pos[1]-posTo[1]+(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))); i++) {
                if (boardArr[alphabet.indexOf(this.pos[0])+(Math.sign(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))*-i)][parseInt(this.pos[1])+(Math.sign(this.pos[1]-posTo[1])*-i)-1] != null) {
                    return false
                }
            }
            this.moved = true
            return true
        } else {
            return false
        }
    }

}

class knight extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-knight.png" : "black-knight.png")
    }
    
    type = "N"

    ValidateMove(posTo, boardArr) {
        if (((alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))**2+(this.pos[1]-posTo[1])**2 == 5) && ((boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1]) == null ? true : (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1]).colour != this.colour)) {
            return true
        } else {
            return false
        }
    }

}

class bishop extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-bishop.png" : "black-bishop.png")
    }
    
    type = "B"

    ValidateMove(posTo, boardArr) {
        if (Math.abs(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0])) == Math.abs(this.pos[1]-posTo[1]) && (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null ? true : boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour != this.colour)) {
            for (let i = 1; i < Math.abs(this.pos[1]-posTo[1]); i++) {
                if (boardArr[alphabet.indexOf(this.pos[0])+(Math.sign(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))*-i)][parseInt(this.pos[1])+(Math.sign(this.pos[1]-posTo[1])*-i)-1] != null) {
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }

}

class queen extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-queen.png" : "black-queen.jpg")
    }

    type = "Q"

    ValidateMove(posTo, boardArr) {
        if (((this.pos[0] == posTo[0]) && (this.pos[1] != posTo[1]) || (this.pos[0] != posTo[0]) && (this.pos[1] == posTo[1])) && (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null ? true : boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour != this.colour)) {
            for (let i = 1; i < Math.abs(this.pos[1]-posTo[1]+(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))); i++) {
                if (boardArr[alphabet.indexOf(this.pos[0])+(Math.sign(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))*-i)][parseInt(this.pos[1])+(Math.sign(this.pos[1]-posTo[1])*-i)-1] != null) {
                    return false
                }
            }
            return true
        } else if (Math.abs(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0])) == Math.abs(this.pos[1]-posTo[1]) && (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null ? true : boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour != this.colour)) {
            for (let i = 1; i < Math.abs(this.pos[1]-posTo[1]); i++) {
                if (boardArr[alphabet.indexOf(this.pos[0])+(Math.sign(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0]))*-i)][parseInt(this.pos[1])+(Math.sign(this.pos[1]-posTo[1])*-i)-1] != null) {
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }

}

class king extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-king.png" : "black-king.jpg")
    }

    moved = false
    type = "K"

    Castle(rookDistance, castleDir, boardArr, pieceTimer) {
        boardArr[alphabet.indexOf(this.pos[0])+Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] = boardArr[alphabet.indexOf(this.pos[0])+rookDistance*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1]
        boardArr[alphabet.indexOf(this.pos[0])+rookDistance*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1].pos = (alphabet[alphabet.indexOf(this.pos[0])+Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))]+","+this.pos[1]).split(",")
        boardArr[alphabet.indexOf(this.pos[0])+rookDistance*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1].moved = true
        boardArr[alphabet.indexOf(this.pos[0])+rookDistance*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] = null
        boardArr[alphabet.indexOf(this.pos[0])+2*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] = this
        boardArr[alphabet.indexOf(this.pos[0])][this.pos[1]-1] = null
        this.pos = (alphabet[alphabet.indexOf(this.pos[0])+2*Math.sign(alphabet.indexOf(castleDir[0])-alphabet.indexOf(this.pos[0]))] + "," + this.pos[1]).split(",")
        this.SetTimer(pieceTimer)
        return boardArr
    }

    ValidateMove(posTo, boardArr) {
        if ((Math.abs(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0])) < 2) && (Math.abs(this.pos[1]-posTo[1]) < 2) && ((boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null ? true : boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1]).colour !== this.colour)) {
            this.moved = true
            return true
        } else if ((this.pos[1] == posTo[1]) && (this.moved == false)) {
            let i = 0
            while (boardArr[alphabet.indexOf(this.pos[0])+i*Math.sign(alphabet.indexOf(posTo[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] !== undefined) {
                i += 1
                if (boardArr[alphabet.indexOf(this.pos[0])+i*Math.sign(alphabet.indexOf(posTo[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] == null) {
                } else if (boardArr[alphabet.indexOf(this.pos[0])+i*Math.sign(alphabet.indexOf(posTo[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1] instanceof rook) {
                    if ((boardArr[alphabet.indexOf(this.pos[0])+i*Math.sign(alphabet.indexOf(posTo[0])-alphabet.indexOf(this.pos[0]))][this.pos[1]-1].colour == this.colour) && ((boardArr[alphabet.indexOf(this.pos[0])+i*Math.sign(alphabet.indexOf(posTo[0])-alphabet.indexOf(this.pos[0]))][parseInt(this.pos[1]-1)].moved == false))) {
                        return i
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }
        } else {
            return false
        }
    }

}

class pawn extends piece {

    constructor(tile, colour) {
        super(tile, colour)
        this.pos = tile
        this.colour = colour
        this.img = "pieces/"+(colour == "w" ? "white-pawn.png" : "black-pawn.png")
    }

    moved = false
    type = "P"

    ValidateMove(posTo, boardArr) {
        if (boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1] == null) {
            if ((parseInt(this.pos[1])+(this.colour == "w" ? 1 : -1) == posTo[1]) && (this.pos[0] == posTo[0])) {
                this.moved = true
                return true
            } else if ((!this.moved) && (boardArr[alphabet.indexOf(this.pos[0])][parseInt(this.pos[1])+(this.colour == "w" ? 0 : -2)] == null) && (parseInt(this.pos[1])+(this.colour == "w" ? 2 : -2) == posTo[1]) && (this.pos[0] == posTo[0])) {
                return true
            } else {
                return false
            }
        } else if ((boardArr[alphabet.indexOf(posTo[0])][posTo[1]-1].colour != this.colour) && ((parseInt(this.pos[1])+(this.colour == "w" ? 1 : -1) == posTo[1])) && (Math.abs(alphabet.indexOf(this.pos[0])-alphabet.indexOf(posTo[0])) == 1)) {
            return true
        } else {
            return false
        }
    }

}

export {piece, rook, knight, bishop, queen, king, pawn}