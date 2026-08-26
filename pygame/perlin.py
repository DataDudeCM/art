import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint
from perlin_noise import PerlinNoise

##########################
# define functions here
##########################
def draw(o=4,s=1):
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    """Greater octaves = bumpier, seed just shifts to diff position"""
    noise = PerlinNoise(octaves=o, seed=s)

    c = pygame.Color(0)
    surf = pygame.Surface((WIDTH,HEIGHT))
    surf.fill(pygame.Color('White'))
    for j in range(int(WIDTH/4)):
        for i in range(int(HEIGHT/4)):

            #Ensure inputs to noise function are between 0 and 1; outputs will be between -1 and 1"""
            n = noise([i/100,j/100])
            
            c.hsla = (0,0,int(remap(-1,1,0,100,n))) #grayscale
            """Use this section to simulate hills and water
            if n >= 0:
                c = pygame.Color('DarkGreen')
            else:
                c = pygame.Color('Blue')
            """
            pygame.draw.rect(surf,c,(i*4,j*4,4,4))

    pyG1.screen.blit(surf,[0,0])
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
pyG1.createScreen(WIDTH,HEIGHT,'White')

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(pyG1.WHITE) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        mousepos = pygame.mouse.get_pos()       
        draw(remap(0,WIDTH,1,20,mousepos[0]),remap(0,HEIGHT,1,200,mousepos[1]))
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