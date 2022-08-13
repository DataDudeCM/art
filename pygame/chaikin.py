import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
import math
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    index = 0
    points=[]
    for x in range(0,WIDTH,40):
        points.append((x,pyG1.h2+randint(-100,100)))
        index +=1
    pygame.draw.lines(pyG1.screen, linecolor.pal[3], False, points, width=1)

    pygame.display.flip()
    return

def pointdistance(x1,y1,x2,y2):
    d = math.sqrt(math.sq(x2-x1)+math.sq(y2-y1))
    return d

#Global variables
WIDTH = 800
HEIGHT = 800
running = True
drawing = False #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
linecolor = myPalette('Khaki')

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