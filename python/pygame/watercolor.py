import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time, math
from datetime import date, datetime
from random import randint

##########################
# define functions here
##########################

def polygon(surf,pos, sides,sz,color = (0,0,0), rgh = 2, solid = False):
    cx = pos[0]
    cy = pos[1]
    points = []
    newpoints = []
    step = math.radians(360/sides)
    r = sz
    for i in range(sides):
       points.append((r*math.cos(i*step)+cx, r*math.sin(i*step)+cy))
    for a in range(len(points)):
        if a < len(points)-1:
            roughedge(points[a],points[a+1],SEGMENTS, newpoints,rgh)
        else:
            roughedge(points[a],points[0],SEGMENTS, newpoints,rgh)
    #pygame.draw.polygon(screen, (151,151,151,4), newpoints)
    if solid:
        pygame.draw.polygon(surf, color[0:3] + (200,),newpoints,0)
    else:
        pygame.draw.polygon(surf, color[0:3] + (10,), newpoints, 0)

    return

def roughedge(point1, point2, maxdepth, newpoints, rgh=2):
    maxdepth = maxdepth - 1
    #find midpoint
    midx=(point2[0]-point1[0])/2+point1[0] + numpy.random.normal(0,rgh)
    midy=(point2[1]-point1[1])/2+point1[1] + numpy.random.normal(0,rgh)
    if maxdepth > 0:
        #call roughedge twice, once for each new segment
        roughedge(point1, (midx,midy), maxdepth, newpoints)
        roughedge((midx,midy), point2, maxdepth, newpoints)
    else:
        #append the midpoint to newpoints
        newpoints.append((midx,midy))
    return

def draw():
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    pos = (randint(0,WIDTH),randint(0,HEIGHT))
    csize = 50
    numsides = 20
    c = mycol.pal[randint(0,mycol.lenpal-1)]
    for r in range(csize,int(csize*.4),-2):
        surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
        polygon(surf,pos,numsides,r,c,4)
        polygon(surf,pos,numsides,r,c,6)
        polygon(surf,pos,numsides,r,c,16)
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
clearscreen = False #True if the screen should clear in each loop
nump = 200
particles = []
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