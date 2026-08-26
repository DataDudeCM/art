import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
import math
from random import randint, random
from datetime import date, datetime

##########################
# define functions here
##########################

def draw():
    global bigang
    bigang += .05
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    index = 0
    mousepos = pygame.mouse.get_pos()
    bigr = int(mousepos[0])+1
    r = int(mousepos[1]/2)+1
    points=[]
    numpts = 2 # 2 = flower, more points creates dense ball
    """
    for x in range(0,WIDTH+40,40):
        points.append(pygame.Vector2(x,pyG1.h2+randint(-200,200)))
        index +=1
    """
    for i in range(numpts):
        ang = random()*math.pi*2
        x = pyG1.w2+math.cos(bigang % (math.pi*2))*bigr + math.cos(ang)*r
        y = pyG1.h2-math.sin(bigang % (math.pi*2))*bigr - math.sin(ang)*r
        points.append(pygame.Vector2(x,y))
    for i in range(numpts):
        ang = random()*math.pi*2
        x = pyG1.w2+math.cos((bigang % (math.pi*2)) + math.pi)*bigr + math.cos(ang)*r
        y = pyG1.h2-math.sin((bigang % (math.pi*2)) + math.pi)*bigr - math.sin(ang)*r
        points.append(pygame.Vector2(x,y))
    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    """ Pass Surface, List of points, ratio, num iterations, color """
    chaikin(surf, points,.25,8,linecolor.pal[randint(0,linecolor.lenpal-1)],1,True)
    pyG1.screen.blit(surf,(0,0))
    pygame.display.flip()
    return

#Global variables
#640 x 1136 for reels; 2000 x 1400 for large screen
WIDTH = 2000
HEIGHT = 1400
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
linecolor = myPalette('Red3D')
bkgcolor = 'White'
bigang = 0

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(bkgcolor) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        pyG1.clock.tick(30) #set framerate
        #to draw only once uncomment shapearr line
        #drawing = not drawing

    #Wait for user to close screen
    for event in pygame.event.get():
        #If user closes window set running to False and quit
        if event.type == QUIT:
            running = False
        #If user presses 'f' then toggle whether the drawing function continues
        if event.type == KEYDOWN and event.key == pygame.K_BACKSPACE:
            drawing = not drawing
        if event.type == KEYDOWN and event.key == pygame.K_w:
            bkgcolor = 'White'
        if event.type == KEYDOWN and event.key == pygame.K_b:
            bkgcolor = 'Black'
        if event.type == KEYDOWN and event.key == pygame.K_s:
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'chaikinsphere_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')
        #if event.type == KEYDOWN and pygame.K_BACKSPACE:
         #   drawing = not drawing

pygame.quit()
exit()