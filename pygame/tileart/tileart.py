from shutil import register_unpack_format
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint
import numpy as np
from cell import *
from tile import *

##########################
# define functions here
##########################
def startOver():
    global grid
    #create a cell for each spot in the grid
    for i in range(DIM*DIM):
        #for each spot in grid, add a Cell and include all options from DIM*DIM
        if len(grid) <= (DIM*DIM):
            grid.append(Cell(len(tiles)))
        grid[i] = Cell(len(tiles))
        #grid.append(Cell(len(tiles)))

def checkValid(arr, valid):
    for i in range(len(arr)-1,-1,-1):
        element = arr[i]
        if not element in valid:
            #arr.insert(1,i) #remove 1 element at index i
            arr = arr[:i] + arr[i+1:]
    return arr


#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop

tiles = []
tileImages = []
grid = []
DIM = 10

#Load the images as surfaces
for i in range(13):
    tileImages.append(pygame.image.load('tiles/circuit/' + str(i) + '.png'))

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

"""Road images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
tiles.append(Tile(tileImages[1], ["AAA", "ABA", "ABA", "ABA"])) #down facing
tiles.append(Tile(tileImages[2], ["ABA", "AAA", "ABA", "ABA"])) #left facing
tiles.append(Tile(tileImages[3], ["ABA", "ABA", "ABA", "AAA"])) #right facing
tiles.append(Tile(tileImages[4], ["ABA", "ABA", "AAA", "ABA"])) #up facing
"""

#Circuit images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank grey
tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"])) #blank green
tiles.append(Tile(tileImages[2], ["BBB", "ACA", "BBB", "BBB"])) #right only - light green
tiles.append(Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"])) #straight horiz - white road
tiles.append(Tile(tileImages[4], ["ABB", "ACA", "ABB", "AAA"])) #
tiles.append(Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"])) #
tiles.append(Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"])) #straight horiz - light green road
tiles.append(Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"])) #
tiles.append(Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"])) #
tiles.append(Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"])) #
tiles.append(Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"])) #
tiles.append(Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"])) #
tiles.append(Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"])) #

"""
for i in range(2,13): # no need to rotate the 1st or 2nd tiles as they are squares
    for j in range(0,4):
        tiles.append(tiles[i].rotate(j))
"""


#for each tile, analyze it against all tiles
for i in range(len(tiles)):
    tile = tiles[i]
    tile.analyze(tiles)

startOver()

def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    w = WIDTH / DIM
    h = HEIGHT / DIM
    global grid
    global drawing
    for j in range(DIM):
        for i in range(DIM):
            cell = grid[i+ j * DIM] #get the cell at each grid position
            if cell.collapsed:
                index = cell.options[0]
                scaledimage = pygame.transform.scale(tiles[index].img, (int(w+1), int(h+1)))
                pyG1.screen.blit(scaledimage, (i*w, j*h))
            else:
                surf = pygame.Surface((w,h)) #create a surface big enough for the image
                surf.fill(pygame.Color('White')) #fill the background of the surface
                pygame.draw.rect(surf,pygame.Color('Black'),(0,0,w,h),1) #draw rect with 2 pix outline
                pyG1.screen.blit(surf,(i*w,j*h))
    
    pygame.display.flip()
    gridCopy = grid #make a copy of grid
    gridCopy = list(filter(lambda x: not x.collapsed, gridCopy))

    if len(gridCopy) == 0:
        drawing = not drawing
        return

    gridCopy.sort(key = lambda x: len(x.options))
    olen = len(gridCopy[0].options)

    stopIndex = 0
    for i in range(len(gridCopy)):
        if len(gridCopy[i].options) > olen:
            stopIndex = 1
            break
    if stopIndex > 0: 
        gridCopy[:stopIndex] #remove everything after the stopIndex

    cell = np.random.choice(gridCopy)
    cell.collapsed = True
    if len(cell.options) > 0:
        pick = np.random.choice(cell.options)
        if pick:
            cell.options = [pick]
        else:
            startOver()
            return
    else:
        startOver()
        return

    nextGrid = []
    for j in range(DIM):
        for i in range(DIM):
            index = i + j * DIM
            if grid[index].collapsed:
                nextGrid.append(grid[index]) #if collapsed, append the cell from orig grid
            else:
                options = []
                #create a new options array consisting of all tiles
                for ii in range(len(tiles)):
                    options.append(ii)
                #Look UP
                if j>0: # if not the top row
                    up = grid[i + (j - 1) * DIM]
                    validOptions = []
                    for option in up.options: #go through valid options for the cell above
                        valid = tiles[option].down
                        validOptions = validOptions + valid # concatenate valid options together
                    options = checkValid(options, validOptions)
                #look right
                if (i < DIM - 1):
                    right = grid[i + 1 + j * DIM]
                    validOptions = []
                    for option in right.options:
                        valid = tiles[option].left
                        validOptions = validOptions + valid
                    options = checkValid(options, validOptions)
                #Look down
                if (j < DIM - 1):
                    down = grid[i + (j+ 1) * DIM]
                    validOptions = []
                    for option in down.options:
                        valid = tiles[option].up
                        validOptions = validOptions + valid
                    options = checkValid(options, validOptions)
                #Look left
                if (i>0):
                    left = grid[i - 1 + j * DIM]
                    validOptions = []
                    for option in left.options:
                        valid = tiles[option].right
                        validOptions = validOptions + valid
                    options = checkValid(options, validOptions)
                nextGrid.append(Cell(options))
    grid = nextGrid

    return

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(pyG1.WHITE) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        #pyG1.clock.tick(60) #set framerate
        #to draw only once uncomment next line
        #drawing = not drawing

    #Wait for user to close screen
    for event in pygame.event.get():
        #If user closes window set running to False and quit
        if event.type == QUIT:
            running = False
        #If user presses 'f' then toggle whether the drawing function continues
        if event.type == KEYDOWN and event.key == pygame.K_BACKSPACE:
            drawing = not drawing
        #if event.type == KEYDOWN and pygame.K_BACKSPACE:
         #   drawing = not drawing

pygame.quit()
exit()