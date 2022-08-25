from turtle import bgcolor
from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from particle import Particle, Attractor
from corefuncs import *
import time
from datetime import date, datetime
from random import randint

##########################
# define functions here
##########################
def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    for p in particle:
        for a in range(numa):
            attractor[a].attract(p)
        p.move()
        p.display(surf, False)
    pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
#640 x 1136 for reels
WIDTH = 800
HEIGHT =800
MARGIN = 5
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
nump = 500
numa = 10
particle = []
attractor = []
palname = 'PinkGray'
bkgcolor = 'Black'
particlecol = myPalette(palname)

radius = 2

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

#Create the particles
for p in range(nump):
    particle.append(Particle(WIDTH,HEIGHT,MARGIN,randint(0,WIDTH), randint(0,HEIGHT), particlecol.pal[randint(0,particlecol.lenpal-1)],radius,2))
    #particle.append(Particle(WIDTH,HEIGHT,MARGIN,randint(0,WIDTH), randint(0,HEIGHT), pygame.Color('White'),radius,2))
    particle[p].damping = 0.01

for a in range(numa):
    attractor.append(Attractor(randint(0,WIDTH), randint(0,HEIGHT),1200))



###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(bkgcolor) #alternatively fill with a background image

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
            clearscreen = not clearscreen
        if event.type == KEYDOWN and event.key == pygame.K_f:
            drawing = not drawing
        if event.type == KEYDOWN and event.key == pygame.K_n:
            usenoise = not usenoise
        if event.type == KEYDOWN and event.key == pygame.K_r:
            for p in particles:
                p.resetNoise()
        if event.type == KEYDOWN and event.key == pygame.K_i:
            if bkgcolor == 'Black':
                bkgcolor = 'White'
            else:
                bkgcolor = 'Black'
        if event.type == KEYDOWN and event.key == pygame.K_s:
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'perlin_lattice_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')
        #if event.type == KEYDOWN and pygame.K_BACKSPACE:
         #   drawing = not drawing

pygame.quit()
exit()