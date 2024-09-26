/*

Beginners: 81 fields (9x9), 10 mines or 35 mines
Advanced: 256 fields (16*16), 40 mines or 99 mines
Professionals: 480 fields (30*16), 99 mines or 170 mines

*/

(() => {
    const canvas = document.querySelector("#game")
    const ctx = canvas.getContext("2d")

    const gridWidth = 9
    const gridHeight = 9

    let texture = new Image()
    texture.src = "./resources/spritesheet.png"

    const zoom = 0.5

    const mines = 10

    if (mines >= gridHeight * gridWidth) {
        console.error("Number of mines can not be larger than cell size")
        return
    }

    let minePosition = new Array(gridWidth * gridHeight)
    let detectorPosition = new Array(gridWidth * gridHeight)
    let coveredPosition = Array(gridWidth * gridHeight).fill(true)
    let flagPosition = Array(gridWidth * gridHeight).fill(false)

    let mouseX, mouseY
    let gridX, gridY
    let mouseDown, mouse1Down = false

    let firstTry = false
    let clearedGrids = []
    let neighboursToClear = []

    let lostPotision

    const floodFill = (x, y) => {
        if ((x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight)) {
            if (coveredPosition[con2Dto1D(x, y)] && !detectorPosition[con2Dto1D(x, y)] && !minePosition[con2Dto1D(x, y)]) {
                coveredPosition[con2Dto1D(x, y)] = false
                floodFill(x, y + 1)
                floodFill(x, y - 1)
                floodFill(x + 1, y)
                floodFill(x - 1, y)
                clearedGrids.push(con2Dto1D(x, y))
            }
        }
    }

    const con1Dto2D = (x) => [x % gridWidth, Math.floor(x / gridWidth)]
    const con2Dto1D = (x, y) => x + y * gridWidth
    const con2Dto1D_check = (x, y) => (x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight) ? (x + y * gridWidth) : -1
    const getMineGrid = (x, y) => (x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight) && minePosition[con2Dto1D(x, y)]

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
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                //ctx.globalAlpha = 1
                if (con2Dto1D(x, y) == lostPotision) {
                    ctx.drawImage(texture, 64, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (flagPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 16, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (coveredPosition[con2Dto1D(x, y)]) {
                    if (mouse1Down && x == gridX && y == gridY) {
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

    const detectMouse = (mouse, click) => {
        if (lostPotision) {
            return
        }
        
        console.log(mouse)
        
        if (mouse.button == 0) {
            mouse1Down = click
        }

        mouseDown = click
        
        //console.log("current mouse pos: ", gridX, gridY)

        // LEFT CLICK
        if (!mouse1Down && mouse.button == 0 && (gridX >= 0 && gridX < gridWidth) && (gridY >= 0 && gridY < gridHeight) && !flagPosition[con2Dto1D(gridX, gridY)]) {
            if (!firstTry) {
                firstTry = true

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
            }

            if (minePosition[con2Dto1D(gridX, gridY)]) {
                lostPotision = con2Dto1D(gridX, gridY)
                
                for (let x = 0; x < gridWidth; x++) {
                    for (let y = 0; y < gridHeight; y++) {
                        coveredPosition[con2Dto1D(x, y)] = false
                    }
                }
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
        if (!mouseDown && mouse.button == 2 && (gridX >= 0 && gridX < gridWidth) && (gridY >= 0 && gridY < gridHeight) && coveredPosition[con2Dto1D(gridX, gridY)]) {
            flagPosition[con2Dto1D(gridX, gridY)] = !flagPosition[con2Dto1D(gridX, gridY)]
        }

        render()
    }

    texture.onload = () => render()

    window.addEventListener('mousemove', (mouse) => trackMouse(mouse))
    window.addEventListener('mousedown', (mouse) => detectMouse(mouse, true))
    window.addEventListener('mouseup', (mouse) => detectMouse(mouse, false))
})()