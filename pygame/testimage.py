import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
from random import randint, random
import math

#Global variables
WIDTH = 400
HEIGHT = WIDTH # code currently assumes squares
XC = int(WIDTH/2)
YC = int(HEIGHT/2)
MARGIN = 50

BKCOLOR = pygame.Color('LightGray')
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,BKCOLOR)
mypal = myPalette('CoffeeGray')

img = pygame.image.load('textures/mila.jpg').convert()

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    pyG1.screen.blit(img,(0,0),(200,200,400,400))
    pygame.display.flip()
    return

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(BKCOLOR) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        pyG1.clock.tick(1) #set framerate
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
        if event.type == KEYDOWN and event.key == pygame.K_o: #opaque texture
            opaque = not opaque
        if event.type == KEYDOWN and event.key == pygame.K_t: #texture toggle
            texture = not texture
        if event.type == KEYDOWN and event.key == pygame.K_d: #dispersion from center toggle
            disperse = not disperse
        if event.type == KEYDOWN and event.key == pygame.K_w: #white background
            BKCOLOR = pygame.Color('LightGray')
        if event.type == KEYDOWN and event.key == pygame.K_b: #black background
            BKCOLOR = pygame.Color('Black')
        if event.type == KEYDOWN and event.key == pygame.K_m: #mixed up texture
            mixedup = not mixedup
        if event.type == KEYDOWN and event.key == pygame.K_s: #save image
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'imagetest_screen_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')
            dt = datetime.now()
            pygame.image.save(img,'images/' + 'imagetest_img_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')


pygame.quit()
exit()