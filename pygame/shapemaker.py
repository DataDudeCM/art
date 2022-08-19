import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint
import numpy as np

#Global variables
WIDTH = 800
HEIGHT = 600
running = True
drawing = True
clearscreen = False
shapeTypes = ['Rect','Circle']
shapeProbs = [.7,.3]
shapeColor = pygame.Color('dodgerblue2')
rectwmax = 100
recthmax = 100

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')
rectcol = myPalette('MutedBasics')
circlecol = myPalette('MutedBasics')

def makeShape():
    #Add something to change the transparency
    shapechoice = np.random.choice(shapeTypes,p=shapeProbs)
    if shapechoice == 'Rect':
        #pygame.draw.rect(pyG1.surface, tuple(list(rectcol.pal[randint(0,rectcol.lenpal - 1)])[0:3]) + (255,), [randint(0,WIDTH),randint(0,HEIGHT),randint(5,rectwmax),randint(5,recthmax)],width=randint(0,3))
        artrect(pyG1.screen, tuple(list(rectcol.pal[randint(0,rectcol.lenpal - 1)])[0:3]), pygame.Vector2(randint(0,WIDTH),randint(0,HEIGHT)),randint(5,rectwmax),randint(5,recthmax))
    if shapechoice == 'Circle':
        surf = pygame.Surface((800,600), pygame.SRCALPHA)
        pygame.draw.circle(surf, tuple(list(circlecol.pal[randint(0,circlecol.lenpal - 1)])[0:3]) + (255,), [randint(0,WIDTH),randint(0,HEIGHT)],randint(5,50),width = randint(0,3)) #includes alpha on color tuple
        pyG1.screen.blit(surf,[0,0])
##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm

    makeShape()

    #pyG1.screen.blit(pyG1.surface,[0,0])
    pygame.display.flip()
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
        pyG1.clock.tick(60) #set framerate
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