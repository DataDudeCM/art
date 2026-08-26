import pygame
from pygame.locals import *
from pyGEnv import pyGEnv
from corefuncs import *
import time
from random import randint

#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = True

#Setup screen
pyG1 = pyGEnv()
pyG1.create_screen(w=WIDTH,h=HEIGHT)

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    pygame.draw.line(pyG1.surface, pyG1.RED, (randint(0,WIDTH),HEIGHT),(0,randint(0,HEIGHT)), 2)

    pyG1.screen.blit(pyG1.surface,(0,0)) #merges the surface with the screen
    pygame.display.flip()

###########################
#      Main Program
###########################
while running:

    if drawing:
        #Draw stuff - will execute at least once 
        draw()
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
