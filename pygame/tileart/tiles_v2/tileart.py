from shutil import register_unpack_format
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
import random
from random import randint
import numpy as np
from cell import *
from tile import *
import cProfile, pstats

import ttkbootstrap as ttk
from ttkbootstrap.constants import *

#Global variables
WIDTH = 1200
HEIGHT = 1200
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop

tiles = []

grid = []
DIM = 10
opaque = True
textured = False
BKCOLOR = pygame.Color('Black')

root = ttk.Window(themename="darkly")
root.title('Variables')

itextured = ttk.BooleanVar()
idim = ttk.IntVar()

lf=ttk.Labelframe(root,text="Toggles",style="info")
lf.grid(row=0,column=0,padx=5,pady=5)
l2 = ttk.Label(lf, text='Textured:',anchor=E).grid(row=1,column=0,sticky=W+E, padx=5, pady=5)
c2 = ttk.Checkbutton(lf, variable = itextured, onvalue=True, offvalue=False, bootstyle="info-round-toggle").grid(row=1,column=1,sticky=W)
l3 = ttk.Label(lf, text='DIM:',anchor=E).grid(row=2,column=0,sticky=W+E, padx=5, pady=5)
s1 = ttk.Scale(lf, variable = idim, bootstyle="info", value= DIM, from_=2, to=20).grid(row=2,column = 1,padx=5,pady=5)
#l3 = ttk.Label(lf, text=DIM,anchor=E).grid(row=3,column=0,sticky=W+E, padx=5, pady=5)
root.update()

def add_soft_shadow(image, offset=(10,10), alpha=40):
    w, h = image.get_size()
    shadow_surface = pygame.Surface((w + 20, h + 20), pygame.SRCALPHA)

    shadow = image.copy()
    shadow.fill((0, 0, 0, 0), special_flags=pygame.BLEND_RGBA_MULT)
    shadow.set_alpha(alpha)

    # Layer multiple slightly offset shadows
    for i in range(4):
        shadow_surface.blit(shadow, (offset[0] + i, offset[1] + i))

    shadow_surface.blit(image, (0, 0))
    return shadow_surface

def startOver():
                #clearscreen
    if clearscreen:
        pyG1.screen.fill(pygame.Color("#00FF00")) #alternatively fill with a background image
        background_image = pygame.image.load('../../textures/wall1.jpg').convert_alpha()
        background_image = pygame.transform.scale(background_image, (WIDTH, HEIGHT))
        pyG1.screen.blit(background_image,(0,0))
    
        
    pygame.display.flip()
    global DIM
    global grid
    grid =[]
    if idim.get() == 0:
        DIM = 10
    else:
        DIM = idim.get()
    #create a cell for each spot in the grid
    grid = [Cell(len(tiles)) for item in range (DIM*DIM)]
    """
    for i in range(DIM*DIM):
        #for each spot in grid, add a Cell and include all options from DIM*DIM
        grid.append(Cell(len(tiles)))
    """

def checkValid(arr, valid): #removes options not considered valid
    return [*set(arr).intersection(valid)]


def draw():
    #Use pyG1.surface to enable transparency and alpha color parm
    w = WIDTH / DIM
    h = HEIGHT / DIM

    global grid
    global drawing
    for j in range(DIM):
        for i in range(DIM):
            cell = grid[i+ j * DIM] #get the cell at each grid position
            if cell.collapsed and not cell.drawn: #if the cell is collapsed and not drawn, draw it
                cell.drawn = True   
                index = cell.options[0]
                #scale the image based on the dimensions of the screen
                scaledimage = pygame.transform.scale(tiles[index].img, (int(w+1), int(h+1)))
                #tile_with_shadow = add_soft_shadow(scaledimage) #add soft shadow to the tile
                pyG1.screen.blit(scaledimage, (i*w, j*h))
                pygame.display.update(pygame.Rect(i*w, j*h, w+1, h+1))
                
                #pyG1.screen.blit(scaledimage, (i*w, j*h))
                #if textured:
                #    surf2.blit(pygame.transform.scale(textureimg,(int(w+1), int(h+1))),(i*w, j*h))

            #else:
                #surf = pygame.Surface((w,h)) #create a surface big enough for the image
                #surf.fill(pygame.Color('White')) #fill the background of the surface
                #pygame.draw.rect(surf,pygame.Color('Black'),(0,0,w,h),1) #draw rect with 2 pix outline
                #pyG1.screen.blit(surf,(i*w,j*h))

    #if textured:
    #    pyG1.screen.blit(textureimg,(0,0))
    #pygame.display.flip()
    gridCopy = grid #make a copy of grid
    #print("Before", gridCopy)
    gridCopy = list(filter(lambda x: not x.collapsed, gridCopy))
    #print("After",gridCopy)

    if len(gridCopy) == 0:
        drawing = not drawing
        #pygame.display.flip()
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

def main():
    global running, drawing, textured
    
    while running:

        if drawing:

                
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
            if event.type == KEYDOWN and event.key == pygame.K_s:
                dt = datetime.now()
                pygame.image.save(pyG1.screen,'../../images/' + 'tileart_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')
        root.update()
    root.quit()

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

setuptiles(input("Enter the name of the tileset: "),tiles)
pyG1.screen.fill(pygame.Color("#00FF00")) #alternatively fill with a background image
startOver()

main()

pygame.quit()

exit()