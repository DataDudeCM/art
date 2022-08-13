import pygame
from pygame.locals import *
from pyGEnv import pyGEnv
from corefuncs import *
import time
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm

    pygame.draw.rect(pyG1.surface, pyG1.GRAY, [100,100,200,100])

    pyG1.screen.blit(pyG1.surface,[0,0])
    pygame.display.flip()
    return

#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = True
clearscreen = True

#Setup screen
pyG1 = pyGEnv()
pyG1.create_screen(w=WIDTH,h=HEIGHT)


###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.surface.fill(pyG1.BLACK) #alternatively fill with a background image

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
