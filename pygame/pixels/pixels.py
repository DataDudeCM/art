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
WIDTH = 600
HEIGHT = 600
DIM = 2 #diameter of circle or 
OVERLAP = 0 #how pixels of overlap 
TRANSP = 200 #255 = opaque
WIDTHD = int(WIDTH / DIM)
HEIGHTD = int(HEIGHT / DIM)
NUMSTARTPIXELS = 3
iterations = 0
maxiterations = WIDTHD * HEIGHTD

running = True
drawing = True #True if drawing in a loop
clearscreen = False #True if the screen should clear in each loop
pixels = []
palname = 'Seattle'
pixelcol = myPalette(palname)
bkgcolor = 'Black'


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
        for i in range(4): # 0 = top, 1 = right, 2 = bottom, 3 = left; set to bkgcolor first
            self.neighborcolors.append(pygame.Color(bkgcolor)) 
    
    def pickcolor(self):
        return self.color

    def draw(self):
        self.collapsed = True
        #set neighbors to true

        # above 
        if self.yd > 0:
            npixelindex = int(self.xd + (self.yd - 1) * WIDTHD)
            pixels[npixelindex].neighbor = True
            # set bottom [2] color 
            pixels[npixelindex].neighborcolors[2] = self.color
        # right
        if (self.xd < WIDTHD - 1):
            npixelindex = int(self.xd + 1 + self.yd * WIDTHD)
            pixels[npixelindex].neighbor = True
            pixels[npixelindex].neighborcolors[3] = self.color
        # down
        if (self.yd < HEIGHTD - 1):
            npixelindex = int(self.xd + (self.yd + 1) * WIDTHD)
            pixels[npixelindex].neighbor = True
            pixels[npixelindex].neighborcolors[0] = self.color
        # left
        if (self.xd > 0):
            npixelindex = int(self.xd - 1 + (self.yd * WIDTHD))
            pixels[npixelindex].neighbor = True
            pixels[npixelindex].neighborcolors[1] = self.color
        
        ccolor = self.pickcolor()[0:3] #grab only the hsb elements

        surf = pygame.Surface((WIDTH,HEIGHT),SRCALPHA)
        ctransp = remap(0,maxiterations,255,0,iterations)
        pygame.draw.circle(surf, ccolor + (ctransp,), (self.x+int(DIM/2),self.y+int(DIM/2)), DIM/2+OVERLAP)
        pyG1.screen.blit(surf,[0,0]) #blit the surface to the screen   
        pygame.display.flip()

    def __repr__(self):
        return ("Collapsed: " + str(self.collapsed) + " Neighbor: " + str(self.neighbor) + " Color: " + str(self.color))

##########################
# define functions here
##########################
def draw():
    global drawing, iterations
    iterations += 1
    neighborlist = []
    #Primary draw routine


    if len(list(filter(lambda x: not x.collapsed, pixels))) == 0: # all pixels are collapsed
        drawing = False
        print("Done")
        return
    else: # not all pixels are collapsed 
        # Create a list of neighbors
        neighborlist = list(filter(lambda x: x.neighbor and not x.collapsed, pixels))
        if len(neighborlist) == 0: #
            # No neighbors; should be an error 
            print("none left")
            pass
        else:
            # Pick one of the neighbors
            pixel = random.choice(neighborlist)
            pixel.draw()
            #drawing = False #temporary

    return

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,bkgcolor)
#Use pyG1.surface to enable transparency and alpha color parm


for y in range(HEIGHTD):
    for x in range(WIDTHD):
        #print(pixelcol.pal[randint(0,pixelcol.lenpal-1)])
        #pixels.append(Pixel(x*DIM,y*DIM,pixelcol.pal[randint(0,pixelcol.lenpal-1)]))
        pixels.append(Pixel(x*DIM,y*DIM,pygame.Color('Blue')))

# Pick and draw first pixel
for i in range(NUMSTARTPIXELS):
    pixel = random.choice(pixels)
    pixel.draw()


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