(() => {
    const canvas = document.querySelector("#game")
    const ctx = canvas.getContext("2d")

    const gridWidth = 30
    const gridHeight = 16

    let texture = new Image()
    texture.src = "./resources/spritesheet.png"

    const zoom = 1

    const mines = 99

    if (mines >= gridHeight * gridWidth) {
        console.error("Number of mines can not be larger than cell size")
        return
    }

    let minePosition = new Array(gridWidth * gridHeight)
    let detectorPosition = new Array(gridWidth * gridHeight)
    let coveredPosition = Array(gridWidth * gridHeight).fill(true)

    const floodFill = (x, y) => {
        if ((x >= 0 && x < gridWidth) && (y >= 0 && y < gridHeight)) {
            if (!detectorPosition[con2Dto1D(x, y)] && coveredPosition[con2Dto1D(x, y)]) {
                coveredPosition[con2Dto1D(x, y)] = false
                floodFill(x, y + 1)
                floodFill(x, y - 1)
                floodFill(x + 1, y)
                floodFill(x - 1, y)
            }
        }
    }
    
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

    let neighboursToClear = []
    const arrClearPush = (idx) => {
        if (idx != -1 && !neighboursToClear.find((val) => val == idx)) {
            neighboursToClear.push(idx)
        }
    }
    const clearNeighbours = (x, y) => {
        arrClearPush(con2Dto1D_check(x - 1, y)) // leftGrid
        arrClearPush(con2Dto1D_check(x + 1, y)) // rightGrid
        arrClearPush(con2Dto1D_check(x, y - 1)) // topGrid
        arrClearPush(con2Dto1D_check(x, y + 1)) // bottomGrid
    
        arrClearPush(con2Dto1D_check(x - 1, y - 1)) // leftTopGrid
        arrClearPush(con2Dto1D_check(x + 1, y - 1)) // rightTopGrid
        arrClearPush(con2Dto1D_check(x - 1, y + 1)) // leftBottomGrid
        arrClearPush(con2Dto1D_check(x + 1, y + 1)) // rightBottomGrid
    }
    
    let idx = mines
    while (idx > 0) {
        const pos = Math.floor(Math.random() * (gridWidth * gridHeight) - 1)
        if (!minePosition[pos]) {
            minePosition[pos] = true
            idx--
        }
    }

    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            detectorPosition[con2Dto1D(x, y)] = checkNeighbours(x, y)
        }
    }

    {floodFill(0, 0)
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            if (!coveredPosition[con2Dto1D(x, y)]) {
                clearNeighbours(x, y)
            }
        }
    }}

    neighboursToClear.forEach((idx) => {
        coveredPosition[idx] = false
    })

    canvas.width = gridWidth * 16 * zoom
    canvas.height = gridHeight * 16 * zoom
    canvas.scrollLeft = 100
    ctx.imageSmoothingEnabled = false;

    console.log(minePosition)

    texture.onload = () => {
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                //ctx.globalAlpha = 1;
                if (coveredPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 0, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (getMineGrid(x, y)) {
                    ctx.drawImage(texture, 48, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else if (detectorPosition[con2Dto1D(x, y)]) {
                    ctx.drawImage(texture, 48 + 16 * detectorPosition[con2Dto1D(x, y)], 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } else {
                    ctx.drawImage(texture, 32, 0, 16, 16, 16 * x * zoom, 16 * y * zoom, 16 * zoom, 16 * zoom)
                } 
            }
        }
    }
})()