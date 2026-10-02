from shutil import register_unpack_format
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
import random
from random import randint
import numpy as np
from cell import *
from tile import *
import cProfile, pstats

##########################
# define functions here
##########################
def startOver():
    global DIM
    global grid
    DIM=int(input("Dim = "))
    #create a cell for each spot in the grid
    for i in range(DIM*DIM):
        #for each spot in grid, add a Cell and include all options from DIM*DIM
        if len(grid) <= (DIM*DIM):
            grid.append(Cell(len(tiles)))
        grid[i] = Cell(len(tiles))
        #grid.append(Cell(len(tiles)))

def checkValid(arr, valid): #removes options not considered valid
    """
    for i in range(len(arr)-1,-1,-1): #traverse backwards thru the array
        element = arr[i]
        if not element in valid:
            #arr.insert(1,i) #remove 1 element at index i
            arr = arr[:i] + arr[i+1:]
    """
    return [*set(arr).intersection(valid)]


#Global variables
WIDTH = 800
HEIGHT = 800
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop

tiles = []
tileImages = []
grid = []
DIM = 20

#Load the images as surfaces
for i in range(13):
    tileImages.append(pygame.image.load('../tiles/circuit-coding-train/' + str(i) + '.png'))

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

"""
tiles.append(Tile(tileImages[0], ["AAA", "ABA", "ABA", "AAA"])) #blank
tiles.append(Tile(tileImages[1], ["ABA", "ABA", "ABA", "ABA"])) #blank
tiles.append(Tile(tileImages[2], ["AAA", "ABA", "ABA", "ABA"])) #blank
tileweights=[25,25,50] #relative weights of each tile 
"""

"""Road images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
tiles.append(Tile(tileImages[1], ["AAA", "ABA", "ABA", "ABA"])) #down facing
tiles.append(Tile(tileImages[2], ["ABA", "AAA", "ABA", "ABA"])) #left facing
tiles.append(Tile(tileImages[3], ["ABA", "ABA", "ABA", "AAA"])) #right facing
tiles.append(Tile(tileImages[4], ["ABA", "ABA", "AAA", "ABA"])) #up facing
"""

#Circuit images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank grey
tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"])) #blank green
tiles.append(Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"])) #right only - light green
tiles.append(Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"])) #straight horiz - white road
tiles.append(Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"])) #
tiles.append(Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"])) #
tiles.append(Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"])) #straight horiz - light green road
tiles.append(Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"])) #
tiles.append(Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"])) #
tiles.append(Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"])) #
tiles.append(Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"])) #
tiles.append(Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"])) #
tiles.append(Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"])) #
tileweights=[25,10,10,10,10,10,10,5,5,5,5,5,5] #relative weights of each tile 

initialTileCount = len(tiles)
for i in range(0,initialTileCount): # no need to rotate the 1st or 2nd tiles as they are squares
    for j in range(4):
        tiles.append(tiles[i].rotate(j))
        tileweights.append(tileweights[i]) #apply the weight of the original tile to its rotations

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
                #pygame.draw.rect(surf,pygame.Color('Black'),(0,0,w,h),1) #draw rect with 2 pix outline
                pyG1.screen.blit(surf,(i*w,j*h))
    
    pygame.display.flip()
    gridCopy = grid #make a copy of grid
    #print("Before", gridCopy)
    gridCopy = list(filter(lambda x: not x.collapsed, gridCopy))
    #print("After",gridCopy)

    if len(gridCopy) == 0:
        drawing = not drawing
        return

    #sort grid such that those with fewest options are first
    gridCopy.sort(key = lambda x: len(x.options))
    olen = len(gridCopy[0].options)

    stopIndex = 0
    for i in range(len(gridCopy)):
        if len(gridCopy[i].options) > olen:
            stopIndex = i
            break

    if stopIndex > 0: 
        gridCopy = gridCopy[:stopIndex] #remove everything after the stopIndex

    cell = np.random.choice(gridCopy)
    cell.collapsed = True
    olen = len(cell.options)
    if olen > 0:
        wlist = [] #placeholder to store weights corresponding to cell.options list
        for w in range(olen): #wlist should be as long as options list
            wlist.append(tileweights[cell.options[w]])
        pick = random.choices(cell.options,weights=wlist) #apply wlist weights to the options list and pick one
        #pick = np.random.choice(cell.options)
        #pick = random.choices(cell.options,weights=tileweights())
        cell.options = pick
    else:
        input("Reached a blocker - press enter to start over.")
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
                options= list(range(len(tiles))) #fill options with range from 0 to len
                #Look UP
                if j>0: # if not the top row
                    up = grid[i + (j - 1) * DIM] # get the cell at the grid position above
                    validOptions = []
                    for option in up.options: #go through valid options for the cell above
                        valid = tiles[option].down
                        validOptions = validOptions + valid # concatenate valid options together
                        validOptions = [*set(validOptions)] #remove duplicates
                    options = checkValid(options, validOptions)
                #look right
                if (i < DIM - 1):
                    right = grid[i + 1 + j * DIM]
                    validOptions = []
                    for option in right.options:
                        valid = tiles[option].left
                        validOptions = validOptions + valid
                        validOptions = [*set(validOptions)]
                    options = checkValid(options, validOptions)
                #Look down
                if (j < DIM - 1):
                    down = grid[i + (j+ 1) * DIM]
                    validOptions = []
                    for option in down.options:
                        valid = tiles[option].up
                        validOptions = validOptions + valid
                        validOptions = [*set(validOptions)]
                    options = checkValid(options, validOptions)
                #Look left
                if (i>0):
                    left = grid[i - 1 + j * DIM]
                    validOptions = []
                    for option in left.options:
                        valid = tiles[option].right
                        validOptions = validOptions + valid
                        validOptions = [*set(validOptions)]
                    options = checkValid(options, validOptions)
                #options = checkValid(options, validOptions)
                #print("\n",j,i,"After: ",options, validOptions)
                nextGrid.append(Cell(options))
    grid = nextGrid

    return

###########################
#      Main Program
###########################
def main():
    global running, drawing
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
                startOver()
                drawing = True
            #if event.type == KEYDOWN and pygame.K_BACKSPACE:
            #   drawing = not drawing
"""
profile = cProfile.Profile()
profile.runcall(main)
ps = pstats.Stats(profile)
ps.sort_stats(pstats.SortKey.CUMULATIVE).print_stats()
"""
main()
pygame.quit()
exit()
