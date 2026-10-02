import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time, math
from datetime import date, datetime
from random import randint
from perlin_noise import PerlinNoise

##########################
# define functions here
##########################

def roughedge(surf, c, point1, point2, maxdepth, rgh=5):
    maxdepth = maxdepth - 1
    #find midpoint
    global noise

    midx=(point2[0]-point1[0])/2+point1[0]
    midy=(point2[1]-point1[1])/2+point1[1] 

    n=noise(midx/1000)
    #midx = midx + numpy.random.normal(0,rgh)
    midy = midy + n*10
    if maxdepth > 0:
        #call roughedge twice, once for each new segment
        roughedge(surf, c, point1, (midx,midy), maxdepth)
        roughedge(surf, c, (midx,midy), point2, maxdepth)
    else: 
        #append the midpoint to newpoints
        pygame.draw.line(surf, c, point1,(midx,midy))
        pygame.draw.line(surf, c, (midx,midy), point2)
    return

def draw():
    global noise
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    points = []
    startpos = (0,400)
    endpos = (800,400)
    noise = PerlinNoise(octaves=4, seed=randint(1,400))
    c = mycol.pal[randint(0,mycol.lenpal-1)]
    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    roughedge(surf, c[0:3] + (200,), startpos,endpos, 12)
    pyG1.screen.blit(surf,[0,0])   
    pygame.display.flip()
    return

#Global variables
#640 x 1136 for reels
WIDTH = 800
HEIGHT =800
SEGMENTS = 4
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
palname = 'TheBeach'
bkgcolor = 'Black'
mycol = myPalette(palname)

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

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
            clearscreen = not clearscreen
        if event.type == KEYDOWN and event.key == pygame.K_f:
            drawing = not drawing
        if event.type == KEYDOWN and event.key == pygame.K_n:
            usenoise = not usenoise
        if event.type == KEYDOWN and event.key == pygame.K_c:
            circles = not circles
        if event.type == KEYDOWN and event.key == pygame.K_d:
            drawparticles = not drawparticles
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