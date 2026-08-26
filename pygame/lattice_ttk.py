from turtle import bgcolor
from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from particle1 import Particle
from corefuncs import *
import time
from datetime import date, datetime
from random import randint

import ttkbootstrap as ttk
from ttkbootstrap.constants import *

root = ttk.Window(themename="darkly")
root.title('Variables')
root.geometry("200x100")

var = ttk.IntVar()
var2 = ttk.BooleanVar()

c = ttk.Checkbutton(root, text="Clearscreen", variable = var, bootstyle="round-toggle").pack(side=LEFT, padx=10)
c = ttk.Checkbutton(root, text="Circles", variable = var2, onvalue=True, offvalue=False, bootstyle="round-toggle").pack(side=LEFT)

##########################
# define functions here
##########################
def draw():
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
                            pygame.draw.circle(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y],dis/2,1)
                        #if (type == 2)
                        #    pygame.draw.circle(surf, p5.Vector.lerp(particles[a].V,particles[b].V,0.5).x,p5.Vector.lerp(particles[a].V,particles[b].V,0.5).y, + 
                        #    dis)
                    #Draw lines relative to distance
                    transp = remap(0,dislimit,200,0,dis)
                    pygame.draw.line(surf, a.color[0:3] + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1)
                    #pygame.draw.line(surf, (0,0,0) + (transp,), [a.pos.x,a.pos.y], [b.pos.x,b.pos.y],1) #black lines

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
WIDTH = 1200
HEIGHT =800
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
nump = 200
particles = []
palname = 'Red3D'
bkgcolor = 'White'
particlecol = myPalette(palname)
noise = PerlinNoise(1,1)
usenoise = False
dislimit = 100
circles=False
drawparticles = False
cirtype = 1
radius = 1

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)

for p in range(nump):
    particles.append(Particle(WIDTH,HEIGHT,particlecol.pal[randint(0,particlecol.lenpal-1)],palname,radius,5))

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
    if  var.get(): #checkbox
        clearscreen = True
    else:
        clearscreen = False
    if  var2.get(): #checkbox
        circles = True
    else:
        circles = False
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

    root.update() #updates the dialogbox

root.quit() #closes the dialogbox
pygame.quit()
exit()