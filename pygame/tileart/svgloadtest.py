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

#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = False #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop

img1 = pygame.image.load('tiles/A_02.svg')

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

scaledimage = pygame.transform.scale(img1,(200,200))
pyG1.screen.blit(scaledimage, [0,0])
pygame.display.flip()

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
        drawing = not drawing

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