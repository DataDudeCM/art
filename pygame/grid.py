import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
from random import randint, random
import math


#Global variables
WIDTH = 1000
HEIGHT = WIDTH # code currently assumes squares
XC = int(WIDTH/2)
YC = int(HEIGHT/2)
MARGIN = 50
RES = 4 # resolution of the grid: 4 means 4x4
#CELLSIZE = 175 #175 is 4 boxes in screen of 800 with margin of 50
CELLSIZE = int((WIDTH - MARGIN*2)/RES)
PADDING = 1
BKCOLOR = pygame.Color('LightGray')
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,BKCOLOR)
mypal = myPalette('CoffeeGray')
pygame.font.init()
font = pygame.font.SysFont('Arial',12)
text = font.render('cmARTcreations.com - (c) 2022', True, pygame.Color('Black'))
textRect = text.get_rect()
textRect.center = (WIDTH - 120, HEIGHT - MARGIN+10)

##########################
# define functions here
##########################
def drawbox(x,y,w,p,depth):
    """Draws recursive shapes within a box"""
    depth = depth - 1
    if depth == 0 or random() <= .4: #40% of time don't go deeper
        cellcenter = [x+int(w/2),y+int(w/2)]
        if random() <= 0.1: #25% of time don't fill objects
            if w <= 40:
                bw = 1
            else:
                bw = 2
        else:
            bw = 0
        if random() <= .8: #draw 80% of the time
            if random() > .25: #75% of the time draw squares
                pygame.draw.rect(pyG1.screen,mypal.pal[randint(0,mypal.lenpal-1)],(x+p,y+p,w-p*2,w-p*2),bw)
            else:
                pygame.draw.circle(pyG1.screen,mypal.pal[randint(0,mypal.lenpal-1)],cellcenter,math.floor((w-p*2)/2),bw)
    else: 
        """Draw 4 shapes at next level down"""
        w = int(w/2)
        if w > 2: #ensure it will be big enough to see
            drawbox(x,y,w,p,depth)
            drawbox(x+w,y,w,p,depth)
            drawbox(x,y+w,w,p,depth)
            drawbox(x+w,y+w,w,p,depth)

def draw():
    #Primary draw routine
    for y in range(MARGIN, WIDTH-MARGIN*2, CELLSIZE):
        for x in range(MARGIN, HEIGHT-MARGIN*2, CELLSIZE):
            drawbox(x,y,CELLSIZE,PADDING,randint(2,6))
    pyG1.screen.blit(text,textRect)
    #pygame.draw.line(pyG1.screen,pygame.Color('Black'),(MARGIN,HEIGHT-MARGIN+12),(WIDTH-200,HEIGHT-MARGIN+12))
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
        if event.type == KEYDOWN and event.key == pygame.K_s:
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'grid_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')

pygame.quit()
exit()