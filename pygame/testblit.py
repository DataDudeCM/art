import pygame
from pygame.locals import *
from pyGEnv import pyGEnv
from corefuncs import *
import time
from random import randint

##########################
# define functions here
##########################
def draw(x):
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    surface = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    pygame.draw.rect(surface, pyG1.RED +(10,), [100+x,0,200,50])
    #pyG1.screen.blit(surface,[0,0])
    #surface = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    pygame.draw.rect(surface, pyG1.RED +(50,), [100+x,40,200,50])
    #pyG1.screen.blit(surface,[0,0])
    #surface = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    pygame.draw.rect(surface, pyG1.RED +(100,), [100+x,80,200,50])
    #pyG1.screen.blit(surface,[0,0])
    #surface = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    pygame.draw.rect(surface, pyG1.RED +(150,), [100+x,120,200,50])
    #pyG1.screen.blit(surface,[0,0])
    #surface = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    pygame.draw.rect(surface, pyG1.RED, [100+x,160,200,50])
    #pyG1.screen.blit(surface,[0,0])


    pyG1.screen.blit(surface,[0,0])
    pygame.display.flip()
    return

#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop


#Setup screen
pyG1 = pyGEnv()
pyG1.create_screen(w=WIDTH,h=HEIGHT)

pyG1.screen.fill(pyG1.WHITE)
x = 0
###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(pyG1.WHITE) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw(x)
        x = x + 10
        pyG1.clock.tick(10) #set framerate
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