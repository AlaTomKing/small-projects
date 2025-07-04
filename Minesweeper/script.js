/*

Beginners: 81 fields (9x9), 10 mines or 35 mines
Advanced: 256 fields (16*16), 40 mines or 99 mines
Professionals: 480 fields (30*16), 99 mines or 170 mines

*/

(() => {
    const canvas = document.querySelector("#game")
    const ctx = canvas.getContext("2d")

    const gridWidth = 16
    const gridHeight = 16

    let texture = new Image()
    texture.src = "./resources/spritesheet_dark.png"

    const zoom = 2

    const mines = 40

    if (mines >= gridHeight * gridWidth) {
        console.error("Number of mines can not be larger than cell size")
        return
    }

    let minePosition = new Array(gridWidth * gridHeight)
    let detectorPosition = new Array(gridWidth * gridHeight)
    let coveredPosition = new Array(gridWidth * gridHeight).fill(true)
    let flagPosition = new Array(gridWidth * gridHeight).fill(false)
    let neighboursBlankPosition = new Array(gridWidth * gridHeight).fill(false)

    let mouseX, mouseY
    let gridX, gridY
    let detectX, detectY
    let mouseDown, mouse1Down, detectorDown = false

    let win = false
    let lessAnnoying = true // skips having to find a clear area
    let wrapfield = false // edge grids detecing mines can detect opposite sides

    let firstTry = false
    let clearedGrids = []
    let neighboursToClear = []

    let lostPotision

    const mod = (x, y) => (((x % y) + y) % y)
    const con1Dto2D = (x) => [x % gridWidth, Math.floor(x / gridWidth)]
    const con2Dto1D = (x, y) => x + y * gridWidth
    let con2Dto1D_check
    let getMineGrid
    let floodFill
    
    if (wrapfield) {
        con2Dto1D_check = (x, y) => (mod(x, gridWidth) + mod(y, gridHeight) * gridWidth)
        getMineGrid = (x, y) => minePosition[con2Dto1D(mod(x, gridWidth), mod(y, gridHeight))]
        floodFill = (x, y) => {
            if (coveredPosition[con2Dto1D(x, y)] && !detectorPosition[con2Dto1D(x, y)] && !minePosition[con2Dto1D(x, y)]) {
                coveredPosition[con2Dto1D(x, y)] = false
                floodFill(mod(x, gridWidth), mod(y + 1, gridHeight))
                floodFill(mod(x, gridWidth), mod(y - 1, gridHeight))
                floodFill(mod(x + 1, gridWidth), mod(y, gridHeight))
                floodFill(mod(x - 1, gridWidth), mod(y, gridHeight))
                floodFill(mod(x - 1, gridWidth), mod(y - 1, gridHeight))
                floodFill(mod(x + 1, gridWidth), mod(y - 1, gridHeight))
                floodFill(mod(x - 1, gridWidth), mod(y + 1, gridHeight))
                floodFill(mod(x + 1, gridWidth), mod(y + 1, gridHeight))
                clearedGrids.push(con2Dto1D(x, y))
            }
    }
    } else {
        con2Dto1D_check = (x, y) => (x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight) ? (x + y * gridWidth) : -1
        getMineGrid = (x, y) => (x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight) && minePosition[con2Dto1D(x, y)]
        floodFill = (x, y) => {
        if ((x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight)) {
            if (coveredPosition[con2Dto1D(x, y)] && !detectorPosition[con2Dto1D(x, y)] && !minePosition[con2Dto1D(x, y)]) {
                coveredPosition[con2Dto1D(x, y)] = false
                floodFill(x, y + 1)
                floodFill(x, y - 1)
                floodFill(x + 1, y)
                floodFill(x - 1, y)
                floodFill(x - 1, y - 1)
                floodFill(x + 1, y - 1)
                floodFill(x - 1, y + 1)
                floodFill(x + 1, y + 1)
                clearedGrids.push(con2Dto1D(x, y))
            }
        }
    }
    }

    const clearGrid = (x, y) => {
        if ((x >= 0 && x < gridWidth) && (y >= 0 && x < gridHeight)) {
            coveredPosition[con2Dto1D(x, y)] = false
        }
    }

    const checkNeighbours = (x, y) => {
        if (!getMineGrid(x, y)) {
            let sum = 0

            sum += getMineGrid(x - 1, y) || 0 // leftGrid
            sum += getMineGrid(x + 1, y) || 0 // rightGrid
            sum += getMineGrid(x, y - 1) || 0 // topGrid
            sum += getMineGrid(x, y + 1) || 0 // bottomGrid

            sum += getMineGrid(x - 1, y - 1) || 0 // leftTopGrid
            sum += getMineGrid(x + 1, y - 1) || 0 // rightTopGrid
            sum += getMineGrid(x - 1, y + 1) || 0 // leftBottomGrid
            sum += getMineGrid(x + 1, y + 1) || 0 // rightBottomGrid

            return sum
        }
    }

    const arrClearPush = (idx) => {
        if (idx != -1 && !neighboursToClear.find((val) => val == idx)) {
            neighboursToClear.push(idx)
        }
    }
    const clearNeighbours = (pos) => {
        let [x, y] = con1Dto2D(pos)
        arrClearPush(con2Dto1D_check(x - 1, y)) // leftGrid
        arrClearPush(con2Dto1D_check(x + 1, y)) // rightGrid
        arrClearPush(con2Dto1D_check(x, y - 1)) // topGrid
        arrClearPush(con2Dto1D_check(x, y + 1)) // bottomGrid

        arrClearPush(con2Dto1D_check(x - 1, y - 1)) // leftTopGrid
        arrClearPush(con2Dto1D_check(x + 1, y - 1)) // rightTopGrid
        arrClearPush(con2Dto1D_check(x - 1, y + 1)) // leftBottomGrid
        arrClearPush(con2Dto1D_check(x + 1, y + 1)) // rightBottomGrid
    }

    const reset = () => {
        win = false
        firstTry = false
        lostPotision = null

        minePosition = new Array(gridWidth * gridHeight)
        detectorPosition = new Array(gridWidth * gridHeight)
        coveredPosition = new Array(gridWidth * gridHeight).fill(true)
        flagPosition = new Array(gridWidth * gridHeight).fill(false)
        neighboursBlankPosition = new Array(gridWidth * gridHeight).fill(false)

        clearedGrids = []
        neighboursToClear = []

        detectorDown = false

        render()
    }

    /*{
        floodFill(0, 0)

        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                if (!coveredPosition[con2Dto1D(x, y)]) {
                    clearNeighbours(x, y)
                }
            }
        }
    }*/

    /*neighboursToClear.forEach((idx) => {
        coveredPosition[idx] = false
    })*/

    canvas.width = gridWidth * 16 * zoom
    canvas.height = gridHeight * 16 * zoom
    canvas.scrollLeft = 100
    ctx.imageSmoothingEnabled = false

    //console.log(minePosition)

    const render = () => {
        if (win) return

        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                //ctx.globalAlpha = 1
                if (con2Dto1D(x, y) == lostPotision) {
                    ctx.drawImage(texture, 64, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (flagPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 16, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (neighboursBlankPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 32, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (coveredPosition[con2Dto1D(x, y)]) {
                    if (mouse1Down && !detectorDown && x == gridX && y == gridY) {
                        ctx.drawImage(texture, 32, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                    } else {
                        ctx.drawImage(texture, 0, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                    }
                } else if (getMineGrid(x, y)) {
                    ctx.drawImage(texture, 48, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (detectorPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 64 + 16 * detectorPosition[con2Dto1D(x, y)], 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else {
                    ctx.drawImage(texture, 32, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                }
            }
        }
    }

    const trackMouse = (mouse) => {
        if (mouse) {
            mouseX = Math.floor(mouse.x - (innerWidth / 2) + (gridWidth * 16 * zoom / 2))
            mouseY = Math.floor(mouse.y - (innerHeight / 2) + (gridHeight * 16 * zoom / 2))
        }
        //let xx = Math.floor((mousex - (innerWidth / 2) + camera.x) / (gridSize * zoom))
        //let yy = Math.floor((mousey - distancefromtitle - (innerHeight / 2) + camera.y) / (gridSize * zoom))

        gridX = Math.floor(mouseX / (16 * zoom))
        gridY = Math.floor(mouseY / (16 * zoom))

        //console.log(mouseX, mouseY)

        /*if (ctx && (currentMouseGridPosX != xx || currentMouseGridPosY != yy)) {
            currentMouseGridPosX = xx
            currentMouseGridPosY = yy
            render()
        }*/
        render()
    }

    const checkWin = () => {
        let cleared = 0
        let minesCovered = 0
        coveredPosition.forEach((val, idx) => {
            if (val && minePosition[idx]) minesCovered++
            else if (!val) cleared++
        })

        if ((gridWidth*gridHeight)-cleared == mines && minesCovered == mines) {
            minePosition.forEach((val, idx) => {
                if (val) flagPosition[idx] = true
            })
            render()
            win = true
        }
    }

    const detectMouse = (mouse, click) => {
        if (win) return

        trackMouse(mouse)

        if (lostPotision) {
            return
        }

        if (mouse.button == 0) {
            mouse1Down = click
        }

        mouseDown = click

        //console.log("current mouse pos: ", gridX, gridY)

        // LEFT CLICK
        if (!mouse1Down && !detectorDown && mouse.button === 0 && (gridX >= 0 && gridX < gridWidth) && (gridY >= 0 && gridY < gridHeight) && !flagPosition[con2Dto1D(gridX, gridY)]) {
            if (!firstTry) {
                firstTry = true

                do {
                    minePosition = []
                    detectorPosition = []

                    let idx = mines
                    while (idx > 0) {
                        const pos = Math.floor(Math.random() * (gridWidth * gridHeight) - 1)
                        if (!minePosition[pos] && con2Dto1D(gridX, gridY) != pos) {
                            minePosition[pos] = true
                            idx--
                        }
                    }

                    for (let x = 0; x < gridWidth; x++) {
                        for (let y = 0; y < gridHeight; y++) {
                            detectorPosition[con2Dto1D(x, y)] = checkNeighbours(x, y)
                        }
                    }
                } while (lessAnnoying && detectorPosition[con2Dto1D(gridX, gridY)])
            }

            if (minePosition[con2Dto1D(gridX, gridY)]) {
                lostPotision = con2Dto1D(gridX, gridY)

                for (let x = 0; x < gridWidth; x++)
                    for (let y = 0; y < gridHeight; y++)
                        if (minePosition[con2Dto1D(x, y)])
                            coveredPosition[con2Dto1D(x, y)] = false
            } else if (detectorPosition[con2Dto1D(gridX, gridY)]) {
                coveredPosition[con2Dto1D(gridX, gridY)] = false
            } else if (coveredPosition[con2Dto1D(gridX, gridY)]) {
                floodFill(gridX, gridY)

                clearedGrids.forEach((pos) => {
                    clearNeighbours(pos)
                })

                neighboursToClear.forEach((idx) => {
                    coveredPosition[idx] = false
                })

                neighboursToClear = []
                clearedGrids = []
            }
        }

        // RIGHT CLICK
        if (!mouseDown && mouse.button === 2 && (gridX >= 0 && gridX < gridWidth) && (gridY >= 0 && gridY < gridHeight) && coveredPosition[con2Dto1D(gridX, gridY)]) {
            flagPosition[con2Dto1D(gridX, gridY)] = !flagPosition[con2Dto1D(gridX, gridY)]
        }

        if (mouse1Down && detectorPosition[con2Dto1D(gridX, gridY)] && !coveredPosition[con2Dto1D(gridX, gridY)]) {
            detectorDown = true

            detectX = gridX
            detectY = gridY

            const idx1 = con2Dto1D_check(gridX - 1, gridY)
            const idx2 = con2Dto1D_check(gridX + 1, gridY)
            const idx3 = con2Dto1D_check(gridX, gridY - 1)
            const idx4 = con2Dto1D_check(gridX, gridY + 1)
            const idx5 = con2Dto1D_check(gridX - 1, gridY - 1)
            const idx6 = con2Dto1D_check(gridX + 1, gridY - 1)
            const idx7 = con2Dto1D_check(gridX - 1, gridY + 1)
            const idx8 = con2Dto1D_check(gridX + 1, gridY + 1)

            if (idx1 != -1 && coveredPosition[idx1]) neighboursBlankPosition[idx1] = true
            if (idx2 != -1 && coveredPosition[idx2]) neighboursBlankPosition[idx2] = true
            if (idx3 != -1 && coveredPosition[idx3]) neighboursBlankPosition[idx3] = true
            if (idx4 != -1 && coveredPosition[idx4]) neighboursBlankPosition[idx4] = true
            if (idx5 != -1 && coveredPosition[idx5]) neighboursBlankPosition[idx5] = true
            if (idx6 != -1 && coveredPosition[idx6]) neighboursBlankPosition[idx6] = true
            if (idx7 != -1 && coveredPosition[idx7]) neighboursBlankPosition[idx7] = true
            if (idx8 != -1 && coveredPosition[idx8]) neighboursBlankPosition[idx8] = true
        } else {
            detectorDown = false

            let flagCounter = 0

            neighboursBlankPosition.forEach((val, idx) => {
                if (val && flagPosition[idx]) flagCounter++
            })

            if (gridX == detectX && gridY == detectY && flagCounter == detectorPosition[con2Dto1D(detectX, detectY)]) {
                let iter = true
                neighboursBlankPosition.forEach((val, idx) => {
                    if (val && iter) {
                        if (!flagPosition[idx] && minePosition[idx]) {
                            lostPotision = idx
                            iter = false

                            for (let x = 0; x < gridWidth; x++)
                                for (let y = 0; y < gridHeight; y++)
                                    if (minePosition[con2Dto1D(x, y)])
                                        coveredPosition[con2Dto1D(x, y)] = false
                        } else if (detectorPosition[idx]) {
                            coveredPosition[idx] = false
                        } else if (coveredPosition[idx]) {
                            const co = con1Dto2D(idx)
                            floodFill(co[0], co[1])

                            clearedGrids.forEach((pos) => {
                                clearNeighbours(pos)
                            })

                            neighboursToClear.forEach((idx) => {
                                coveredPosition[idx] = false
                            })

                            neighboursToClear = []
                            clearedGrids = []
                        }
                    }
                })
            }

            neighboursBlankPosition = []

            checkWin()
        }

        render()
    }

    texture.onload = () => render()

    window.addEventListener('mousemove', (mouse) => trackMouse(mouse))
    window.addEventListener('mousedown', (mouse) => detectMouse(mouse, true))
    window.addEventListener('mouseup', (mouse) => detectMouse(mouse, false))

    window.addEventListener('keydown', (e) => {if (e.key == "r") reset()})

    canvas.addEventListener('contextmenu', (e) => { e.preventDefault() })
})()