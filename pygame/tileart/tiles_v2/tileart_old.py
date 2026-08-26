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

import ttkbootstrap as ttk
from ttkbootstrap.constants import *

#Global variables
WIDTH = 800
HEIGHT = 800
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop

tiles = []
tileImages = []
grid = []
DIM = 10
opaque = False
textured = False
BKCOLOR = pygame.Color('DarkGray')

root = ttk.Window(themename="darkly")
root.title('Variables')

itextured = ttk.BooleanVar()
idim = ttk.IntVar()

lf=ttk.Labelframe(root,text="Toggles",style="info")
lf.grid(row=0,column=0,padx=5,pady=5)
l2 = ttk.Label(lf, text='Textured:',anchor=E).grid(row=1,column=0,sticky=W+E, padx=5, pady=5)
c2 = ttk.Checkbutton(lf, variable = itextured, onvalue=True, offvalue=False, bootstyle="info-round-toggle").grid(row=1,column=1,sticky=W)
l3 = ttk.Label(lf, text='DIM:',anchor=E).grid(row=2,column=0,sticky=W+E, padx=5, pady=5)
s1 = ttk.Scale(lf, variable = idim, bootstyle="info", value= 10, from_=2, to=40).grid(row=2,column = 1,padx=5,pady=5)
#l3 = ttk.Label(lf, text=DIM,anchor=E).grid(row=3,column=0,sticky=W+E, padx=5, pady=5)
root.update()

##########################
# define functions here
##########################
def startOver():
    global DIM
    global grid
    if idim.get() == 0:
        DIM = 10
    else:
        DIM = idim.get()
    #create a cell for each spot in the grid
    for i in range(DIM*DIM):
        #for each spot in grid, add a Cell and include all options from DIM*DIM
        if len(grid) <= (DIM*DIM):
            grid.append(Cell(len(tiles)))
        grid[i] = Cell(len(tiles))
        #grid.append(Cell(len(tiles)))

def checkValid(arr, valid): #removes options not considered valid
    return [*set(arr).intersection(valid)]

#Load the images as surfaces
for i in range(2):
    tileImages.append(pygame.image.load('../tiles/hole/' + str(i) + '.png'))

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

textureimg = pygame.image.load('../../textures/metal1.jpg').convert()
textureimg = pygame.transform.scale(textureimg,(WIDTH,HEIGHT)) #not sure why this doesn't require 2 margin width
textureimg.set_alpha(40) #

"""
#
#Mondrian images
# Image, Edges, Probability
tiles.append(Tile(tileImages[0], ["YYY", "YYY", "YYY", "YYY"],25)) #corner
tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"],25)) #cross
tiles.append(Tile(tileImages[2], ["RRR", "RRR", "RRR", "RRR"],25)) #t
tiles.append(Tile(tileImages[3], ["BBB", "BBB", "BBB", "BBB"],25)) #t
tiles.append(Tile(tileImages[4], ["LLL", "LLL", "LLL", "LLL"],25)) #corner
tiles.append(Tile(tileImages[5], ["BBB", "BBB", "BBB", "BBB"],25)) #cross
tiles.append(Tile(tileImages[6], ["WWW", "WWW", "WWW", "WWW"],15)) #t
tiles.append(Tile(tileImages[7], ["BBB", "BBB", "BBB", "BBB"],15)) #t

tiles.append(Tile(tileImages[8], ["BBB", "BYY", "YYB", "BBB"],25)) #t
tiles.append(Tile(tileImages[9], ["BYY", "YYY", "YYB", "BBB"],25)) #t
tiles.append(Tile(tileImages[10], ["BBB", "BRR", "RRB", "BBB"],25)) #t
tiles.append(Tile(tileImages[11], ["BRR", "RRR", "RRB", "BBB"],25)) #t
tiles.append(Tile(tileImages[12], ["BBB", "BLL", "LLB", "BBB"],25)) #t
tiles.append(Tile(tileImages[13], ["BLL", "LLL", "LLB", "BBB"],25)) #t
tiles.append(Tile(tileImages[14], ["BBB", "BWW", "WWB", "BBB"],15)) #t
tiles.append(Tile(tileImages[15], ["BWW", "WWW", "WWB", "BBB"],15)) #t
"""
#
#hole images
# Image, Edges, Probability
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],25)) #corner
tiles.append(Tile(tileImages[1], ["AAA", "AAA", "BBB", "AAA"],75)) #cross

"""
#
#pipe images
# Image, Edges, Probability
tiles.append(Tile(tileImages[0], ["AAA", "ABA", "ABA", "AAA"],25)) #corner
tiles.append(Tile(tileImages[1], ["ABA", "ABA", "ABA", "ABA"],25)) #cross
tiles.append(Tile(tileImages[2], ["AAA", "ABA", "ABA", "ABA"],50)) #t
"""

"""Road images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
tiles.append(Tile(tileImages[1], ["AAA", "ABA", "ABA", "ABA"])) #down facing
tiles.append(Tile(tileImages[2], ["ABA", "AAA", "ABA", "ABA"])) #left facing
tiles.append(Tile(tileImages[3], ["ABA", "ABA", "ABA", "AAA"])) #right facing
tiles.append(Tile(tileImages[4], ["ABA", "ABA", "AAA", "ABA"])) #up facing
"""

"""
#Circuit images
tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],40)) #blank grey
tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"],10)) #blank green
tiles.append(Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"],10)) #right only - light green
tiles.append(Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"],10)) #straight horiz - white road
tiles.append(Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"],40)) #
tiles.append(Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"],10)) #
tiles.append(Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"],10)) #straight horiz - light green road
tiles.append(Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"],5)) #
tiles.append(Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"],5)) #
tiles.append(Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"],5)) #
tiles.append(Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"],5)) #
tiles.append(Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"],5)) #
tiles.append(Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"],5)) #
"""

initialTileCount = len(tiles)
for i in range(1,initialTileCount): # no need to rotate the 1st or 2nd tiles as they are squares
    for j in range(4):
        tiles.append(tiles[i].rotate(j))
        #tileweights.append(tileweights[i]) #apply the weight of the original tile to its rotations

#for each tile, analyze it against all tiles
for i in range(len(tiles)):
    tile = tiles[i]
    tile.analyze(tiles)

startOver()

def draw():
    #Primary draw routine
    if opaque:
        textureimg.set_alpha(255)
    else:
        textureimg.set_alpha(60)
    surf = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    surf.fill(BKCOLOR)
    surf.blit(textureimg,(0,0)) # add the background

    surf2 = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    surf2.set_alpha(255)

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
                surf2.blit(scaledimage, (i*w, j*h))
                #surf.blit(textureimg,(i*w, j*h))

            #else:
                #surf = pygame.Surface((w,h)) #create a surface big enough for the image
                #surf.fill(pygame.Color('White')) #fill the background of the surface
                #pygame.draw.rect(surf,pygame.Color('Black'),(0,0,w,h),1) #draw rect with 2 pix outline
                #pyG1.screen.blit(surf,(i*w,j*h))
    pyG1.screen.blit(surf,(0,0))
    pyG1.screen.blit(surf2,(0,0))
    if textured:
        pyG1.screen.blit(textureimg,(0,0))
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
            wlist.append(tiles[cell.options[w]].weight)
        pick = random.choices(cell.options,weights=wlist) #apply wlist weights to the options list and pick one
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
    global running, drawing, textured
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
        if  itextured.get(): #checkbox
            textured = True
        else:
            textured = False
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
        root.update()
    root.quit()
"""
profile = cProfile.Profile()
profile.runcall(main)
ps = pstats.Stats(profile)
ps.sort_stats(pstats.SortKey.CUMULATIVE).print_stats()
"""

main()

pygame.quit()
exit()
