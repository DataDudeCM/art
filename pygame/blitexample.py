import pygame
from pygame.locals import *
from pyGEnv import pyGEnv
from coreClasses import Particle
from corefuncs import *
import time
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    pyG1.surface.blit(myimage,[0,0])
    pygame.draw.rect(pyG1.surface, pyG1.GRAY, [100,100,200,100])
    p1.move()
    pygame.draw.circle(pyG1.surface, p1.color + (50,), p1.V, 20) #includes alpha on color tuple

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

#Create Particles
p1 = Particle(WIDTH,HEIGHT, pyG1.GREEN)

#myimage = pygame.Surface((pyG1.width, pyG1.height), pygame.SRCALPHA)
myimage = pygame.image.load('../images/test.jpg').convert_alpha()
#pyG1.screen.blit(image,(0,0))

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
