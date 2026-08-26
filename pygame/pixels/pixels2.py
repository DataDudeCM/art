# Pixels
from perlin_noise import PerlinNoise
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
import random
from random import randint
import math

#Global variables
#640 x 1136 for reels
WIDTH = 400
HEIGHT =400
DIM = 8
WIDTHD = int(WIDTH / DIM)
HEIGHTD = int(HEIGHT / DIM)
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
pixels = []
palname = 'Seattle'
pixelcol = myPalette(palname)
bkgcolor = 'Black'
neighborlist = []

class Pixel():

    def __init__(self, x,y, color=pygame.Color(bkgcolor)):
        self.x = x
        self.y = y
        self.xd = int(self.x / DIM)
        self.yd = int(self.y / DIM)
        self.color = color
        self.collapsed = False
        self.neighbor = False
        self.neighborcolors = []
        for i in range(4): # 0 = top, 1 = right, 2 = bottom, 3 = right; set to bkgcolor first
            self.neighborcolors.append(pygame.Color(bkgcolor)) 
    
    def draw(self,neighbors):
        self.collapsed = True
        #remove from neighbors
        print(len(neighbors))
        if len(neighbors) > 0:
            neighbors.remove(self)
        #set neighbors to true
        # above 
        if self.yd > 0:
            npixelindex = int(self.xd + (self.yd - 1) * WIDTHD)
            pixels[npixelindex].neighbor = True
            if pixels[npixelindex] not in neighbors and not pixels[npixelindex].collapsed:
                neighbors.append(pixels[npixelindex])
            # set bottom [2] color 
            pixels[npixelindex].neighborcolors[2] = self.color
        # right
        if (self.xd < WIDTHD - 1):
            npixelindex = int(self.xd + 1 + self.yd * WIDTHD)
            pixels[npixelindex].neighbor = True
            if pixels[npixelindex] not in neighbors and not pixels[npixelindex].collapsed:
                neighbors.append(pixels[npixelindex])
        # down
        if (self.yd < HEIGHTD - 1):
            npixelindex = int(self.xd + (self.yd + 1) * HEIGHTD)
            pixels[npixelindex].neighbor = True
            if pixels[npixelindex] not in neighbors and not pixels[npixelindex].collapsed:
                neighbors.append(pixels[npixelindex])
        # left
        if (self.xd > 0):
            npixelindex = int(self.xd - 1 + (self.yd * HEIGHTD))
            pixels[npixelindex].neighbor = True
            if pixels[npixelindex] not in neighbors and not pixels[npixelindex].collapsed:
                neighbors.append(pixels[npixelindex])

        pygame.draw.circle(surf, self.color, (self.x+int(DIM/2),self.y+int(DIM/2)), DIM/2)

    def __repr__(self):
        return ("Collapsed: " + str(self.collapsed) + " Neighbor: " + str(self.neighbor) + " Color: " + str(self.color))

##########################
# define functions here
##########################
def draw():
    global drawing,neighborlist
    #Primary draw routine
    
    if len(neighborlist) == 0: #
        # No neighbors; should be an error 
        print("none left")
        drawing = False
    else:
        # Pick one of the neighbors
        pixel = random.choice(neighborlist)
        pixel.draw(neighborlist)
        #drawing = False #temporary

    pyG1.screen.blit(surf,[0,0]) #blit the surface to the screen   
    pygame.display.flip()

    return

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)
#Use pyG1.surface to enable transparency and alpha color parm
surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA) 

for y in range(HEIGHTD):
    for x in range(WIDTHD):
        #print(pixelcol.pal[randint(0,pixelcol.lenpal-1)])
        pixels.append(Pixel(x*DIM,y*DIM,pixelcol.pal[randint(0,pixelcol.lenpal-1)]))

# Pick and draw first pixel
pixel = random.choice(pixels)
pixel.draw(neighborlist)


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
        if event.type == KEYDOWN and event.key == pygame.K_i:
            if bkgcolor == 'Black':
                bkgcolor = 'White'
            else:
                bkgcolor = 'Black'
        if event.type == KEYDOWN and event.key == pygame.K_s:
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'pixels_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')
        #if event.type == KEYDOWN and pygame.K_BACKSPACE:
         #   drawing = not drawing

pygame.quit()
exit()