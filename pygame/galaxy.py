from turtle import bgcolor
from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from particle import Particle
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

    for p in particles:
        p.move()

    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    for a in particles:  #for every particle
        #add a check to see if a was already connected to b
        cdist = 0
        cnum=1
        for b in particles:  #check distance against every other particle
            if (a != b):
                dis = pygame.Vector2.distance_to(a.pos,b.pos)
                if applygravity:
                    """Apply gravity"""
                    a.gravity(b) #pass particle b to particle a to apply its gravity

                """Draw lines and circles """
                if (dis < dislimit):
                    cdist += dis
                    cnum+= 1
                    #add b to array of found
                    if (circles) and allc == True:  #if toggled creates circles relative to distance in addition to lines
                        transp = remap(0,dislimit,255,0,dis)
                        pygame.draw.circle(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y],dis/2,1)
                    #Draw lines relative to distance
                    if (lines):
                        transp = remap(0,dislimit,255,0,dis)
                        pygame.draw.line(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1)
                        #pygame.draw.line(surf, (0,0,0) + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1) #blacklines
        avgcdist = cdist/cnum
        if (circles) and allc == False:  #if toggled creates circles relative to distance in addition to lines
            transp = remap(0,dislimit,255,0,avgcdist)
            pygame.draw.circle(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y],avgcdist/2,1)

    pyG1.screen.blit(surf,[0,0])
    if drawparticles:
        surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
        for p in particles:
            p.display(surf, False)
        pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
#640 x 1136 for reels
WIDTH = 1600
HEIGHT =1200
MARGIN = 0
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
nump = 400
particles = []
palname = 'TheBlues'
bkgcolor = 'Black'
particlecol = myPalette(palname)
noise = PerlinNoise(1,1)
usenoise = False
dislimit = 200
circles=False
allc = True
lines=False
drawparticles = True
applygravity = True
cirtype = 1
radius = 1

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

for p in range(nump):
    particles.append(Particle(WIDTH,HEIGHT,MARGIN, randint(0,WIDTH), randint(0,HEIGHT), particlecol.pal[randint(0,particlecol.lenpal-1)],randint(radius,radius*5),1))
particles.append(Particle(WIDTH,HEIGHT,MARGIN, randint(0,WIDTH), randint(0,HEIGHT), particlecol.pal[randint(0,particlecol.lenpal-1)],20,1))

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
        if event.type == KEYDOWN and event.key == pygame.K_l:
            lines = not lines
        if event.type == KEYDOWN and event.key == pygame.K_g:
            applygravity = not applygravity
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