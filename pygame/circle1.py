import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint
import math

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    mousepos = pygame.mouse.get_pos()
    r = int(mousepos[0] / 2)
    ang = randint(0,360)
    x = XC + math.cos(ang)*r
    y = YC - math.sin(ang)*r

    #Use pyG1.surface to enable transparency and alpha color parm
    #surf = pygame.Surface((WIDTH,HEIGHT))
    pygame.draw.circle(pyG1.screen,mypal.pal[randint(0,mypal.lenpal-1)],(x,y),randint(0,50), 2)

    #pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
WIDTH = 600
HEIGHT = 600
XC = int(WIDTH/2)
YC = int(HEIGHT/2)
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop


#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')
mypal = myPalette('Khaki')

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