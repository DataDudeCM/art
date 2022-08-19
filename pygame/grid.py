import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
from random import randint, random
import math

"""
Ideas:
+add dispersion using x position
-add dispersion from any direction
-add dispersion using spherical
+add texture to the solid filled objects - add to alpha surface then blit
+add random portion of the texture to each cell drawn
-add image to the solid filled objects or the outlined objects
"""

#Global variables
WIDTH = 1000
HEIGHT = WIDTH # code currently assumes squares
XC = int(WIDTH/2)
YC = int(HEIGHT/2)
MARGIN = 50
RES = 8 # resolution of the grid: 4 means 4x4
#CELLSIZE = 175 #175 is 4 boxes in screen of 800 with margin of 50
cellsize = int((WIDTH - MARGIN*2)/RES)
PADDING = 1
BKCOLOR = pygame.Color('White')
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
texture = False
mixedup = True
disperse = False

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,BKCOLOR)
mypal = myPalette('TheBeach')
pygame.font.init()
font = pygame.font.SysFont('Arial',12)
text = font.render('cmARTcreations.com - (c) 2022', True, pygame.Color('Black'))
textRect = text.get_rect()
textRect.center = (WIDTH - 120, HEIGHT - MARGIN+10)

textureimg = pygame.image.load('textures/beach1.jpg').convert()
textureimg = pygame.transform.scale(textureimg,(WIDTH-MARGIN-PADDING,HEIGHT-MARGIN-PADDING)) #not sure why this doesn't require 2 margin widths
opaque = False
textureimg.set_alpha(60) #

##########################
# define functions here
##########################
def drawbox(surf,x,y,w,p,depth):
    """Draws recursive shapes within a box"""
    depth = depth - 1
    #drawprob = (x/(WIDTH-MARGIN) * y/(HEIGHT-MARGIN)) + .1
    mousepos = pygame.mouse.get_pos()
    if disperse: #need a better formula
        dist = math.sqrt(((x - XC) ** 2) + ((y - YC) ** 2)) - WIDTH/4
        drawprob = remap(0,WIDTH*.5,1,0,dist)
    else:
        drawprob = remap(0,HEIGHT,.1,1,mousepos[1])
    rectprob = 1
    godeeperprob = .75
    textureprob = .75 # probability that a shape has the texture image applied
    if depth == 0 or random() <= (1-godeeperprob): #40% of time don't go deeper
        cellcenter = [x+int(w/2),y+int(w/2)]
        if random() < 0: #25% of time don't fill objects
            if w <= 40:
                bw = 1
            else:
                bw = 2
        else:
            bw = 0
        if random() <= drawprob: #use .8 if 80% no matter the position
            if random() <= rectprob: #75% of the time draw squares
                pygame.draw.rect(surf,mypal.pal[randint(0,mypal.lenpal-1)],(x+p,y+p,w-p*2,w-p*2),bw)
            else:
                pygame.draw.circle(surf,mypal.pal[randint(0,mypal.lenpal-1)],cellcenter,math.floor((w-p*2)/2),bw)
            if texture == True and random() <= textureprob: #could remove the texture variable and just set to 0 textureprob
                if mixedup:
                    surf.blit(textureimg,(x+p,y+p),(randint(0,WIDTH-MARGIN*2-(w-p*2)),randint(0,HEIGHT-MARGIN*2-(w-p*2)),w-p*2,w-p*2))
                else:
                    surf.blit(textureimg,(x+p,y+p),(x+p,y+p,w-p*2,w-p*2))
    else: 
        """Draw 4 shapes at next level down"""
        w = int(w/2)
        if w > 2: #ensure it will be big enough to see
            drawbox(surf,x,y,w,p,depth)
            drawbox(surf,x+w,y,w,p,depth)
            drawbox(surf,x,y+w,w,p,depth)
            drawbox(surf,x+w,y+w,w,p,depth)

def draw():
    #Primary draw routine
    global cellsize
    mousepos = pygame.mouse.get_pos()
    newres = int(remap(0,WIDTH,2,16,mousepos[0]))
    if opaque:
        textureimg.set_alpha(255)
    else:
        textureimg.set_alpha(80)
    cellsize = int((WIDTH - MARGIN*2)/newres)
    boxsurf = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    boxsurf.fill(BKCOLOR)
    for y in range(MARGIN, HEIGHT-MARGIN*2, cellsize):
        for x in range(MARGIN, WIDTH-MARGIN*2, cellsize):
            maxdepth = 4
            #maxdepth = 2+int(6*(1-x/(WIDTH-MARGIN)) * (1-y/(HEIGHT-MARGIN))) #more dense in lower right
            drawbox(boxsurf,x,y,cellsize,PADDING,randint(2,maxdepth))
    pyG1.screen.blit(boxsurf,(0,0))
    pyG1.screen.blit(text,textRect)
    pygame.display.flip()
    return

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(BKCOLOR) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        pyG1.clock.tick(1) #set framerate
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
        if event.type == KEYDOWN and event.key == pygame.K_o: #opaque texture
            opaque = not opaque
        if event.type == KEYDOWN and event.key == pygame.K_t: #texture toggle
            texture = not texture
        if event.type == KEYDOWN and event.key == pygame.K_d: #dispersion from center toggle
            disperse = not disperse
        if event.type == KEYDOWN and event.key == pygame.K_w: #white background
            BKCOLOR = pygame.Color('White')
        if event.type == KEYDOWN and event.key == pygame.K_b: #black background
            BKCOLOR = pygame.Color('Black')
        if event.type == KEYDOWN and event.key == pygame.K_m: #mixed up texture
            mixedup = not mixedup
        if event.type == KEYDOWN and event.key == pygame.K_s: #save image
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'grid_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')

pygame.quit()
exit()