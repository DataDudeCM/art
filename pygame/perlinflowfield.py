from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette, Particle
from corefuncs import *
import time
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    for p in particles:
        p.applyNoise(p.noise) 
        p.move()
        p.display(surf, True)

    """add code to create the lattice"""

    pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
WIDTH = 800
HEIGHT = 800
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
nump = 500
particles = []
palname = 'TheBeach'
particlecol = myPalette(palname)
noise = PerlinNoise(1,1)

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,'Black')

for p in range(nump):
    particles.append(Particle(WIDTH,HEIGHT,particlecol.pal[randint(0,particlecol.lenpal-1)],palname,2))

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill('Black') #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        #pyG1.clock.tick(60) #set framerate
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