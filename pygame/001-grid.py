import pygame
from pygame.locals import *
from pygameinit import pyinit
from coreClasses import myPalette, pyGEnv
import time
from random import randint

WIDTH = 800
HEIGHT = 800

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'White')

running = True
drawing = True

tileCount = 20
astrokeWidth = 2
bstrokeWidth = 2

while running:

    if drawing:
        #Draw stuff - will execute at least once 
        pyG1.screen.fill(Color('white'))
        for gridY in range(tileCount):
            for gridX in range(tileCount):
                posX = WIDTH/tileCount*gridX
                posY = HEIGHT/tileCount*gridY
                toggle = randint(0,1)
                if toggle == 0:
                    pygame.draw.line(pyG1.screen, Color('black'), (posX,posY),(posX+WIDTH/tileCount,posY+HEIGHT/tileCount), astrokeWidth)
                else:
                    pygame.draw.line(pyG1.screen, Color('black'), (posX,posY+WIDTH/tileCount),(posX+HEIGHT/tileCount, posY), bstrokeWidth)
        pygame.display.flip()
        pyG1.clock.tick(5)
    
    #Wait for user to close screen
    for event in pygame.event.get():
        #If user closes window set running to False and quit
        if event.type == QUIT:
            running = False
        #If user presses 'f' then toggle whether the drawing function continues
        if event.type == KEYDOWN and event.key == pygame.K_f:
            drawing = not drawing
        if event.type == KEYDOWN and event.key == pygame.K_UP:
            astrokeWidth += 1
        if event.type == KEYDOWN and event.key == pygame.K_DOWN:
            astrokeWidth -= 1
        if event.type == KEYDOWN and event.key == pygame.K_RIGHT:
            bstrokeWidth += 1
        if event.type == KEYDOWN and event.key == pygame.K_LEFT:
            bstrokeWidth -= 1
