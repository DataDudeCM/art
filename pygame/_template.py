import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    surf = pygame.Surface((WIDTH,HEIGHT))
    pygame.draw.rect(surf, (200,20,40,255), [100,100,200,100])
    pygame.draw.rect(surf, (200,20,40,55), [100,0,200,150])

    pygame.draw.rect(surf, pygame.Color('Gray') +(100,), [100,200,200,100])
    pygame.draw.rect(surf, pygame.Color('Gray') +(150,), [100,300,200,100])

    pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
WIDTH = 400
HEIGHT = 400
running = True
drawing = False #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop


#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

draw()
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
        pyG1.clock.tick(10) #set framerate
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