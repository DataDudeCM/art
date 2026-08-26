from turtle import bgcolor
from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
from random import randint
import math
from particle1 import Particle

##########################
# define functions here
##########################
def draw():
    global counter, dislimit
    counter += 1
    if counter % 100 == 0 and dislimit > 20:
        dislimit = dislimit - 20
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm

    for p in particles:
        if usenoise:
            p.applyNoise(p.noise) 
        p.move()

    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    for a in particles:  #for every particle
        #add a check to see if a was already connected to b
        for b in particles:  #check distance against every other particle
            if (a != b):
                dis = pygame.Vector2.distance_to(a.pos,b.pos)
                if (dis < dislimit):
                    #add b to array of found
                    if (circles):  #if toggled creates circles relative to distance in addition to lines
                        #stroke([208,100,55,map(dis,0,dislimit,80,0)])
                        transp = remap(0,dislimit,100,0,dis)
                        if (cirtype == 1):
                            pygame.draw.circle(surf, pixels[(math.floor(a.pos.x) + math.floor(a.pos.y) * WIDTH)][0:3] + (transp,), [a.pos.x,a.pos.y],dis/2,1)
                        #if (type == 2)
                        #    pygame.draw.circle(surf, p5.Vector.lerp(particles[a].V,particles[b].V,0.5).x,p5.Vector.lerp(particles[a].V,particles[b].V,0.5).y, + 
                        #    dis)
                    #Draw lines relative to distance
                    transp = remap(0,dislimit,255,0,dis)
                    #pygame.draw.line(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1)
                    pygame.draw.line(surf, pixels[(math.floor(a.pos.x) + math.floor(a.pos.y) * WIDTH)][0:3] + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1) #black lines

    pyG1.screen.blit(surf,[0,0])
    surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
    for p in particles:
        c = pixels[(math.floor(p.pos.x) + math.floor(p.pos.y) * WIDTH)]
        p.display(surf, False,c)
    pyG1.screen.blit(surf,[0,0])
    pygame.display.flip()
    return

#Global variables
#640 x 1136 for reels
WIDTH = 800
HEIGHT =800
running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
nump = 160
particles = []
palname = 'TheBlues'
bkgcolor = 'Black'
particlecol = myPalette(palname)
noise = PerlinNoise(1,1)
usenoise = False
dislimit = 180
circles=True
cirtype = 1
radius = 2
counter = 0

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

img = pygame.image.load('textures/bri2.jpg').convert()
img = pygame.transform.scale(img,(WIDTH,HEIGHT))

pixels = []
for y in range(HEIGHT):
    for x in range(WIDTH):
        pixels.append(img.get_at((x,y)))

for p in range(nump):
    particles.append(Particle(WIDTH,HEIGHT,particlecol.pal[randint(0,particlecol.lenpal-1)],palname,radius,2))

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
            clearscreen = not clearscreen
        if event.type == KEYDOWN and event.key == pygame.K_f:
            drawing = not drawing
        if event.type == KEYDOWN and event.key == pygame.K_n:
            usenoise = not usenoise
        if event.type == KEYDOWN and event.key == pygame.K_c:
            circles = not circles
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