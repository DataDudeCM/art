import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from datetime import date, datetime
from random import randint, random
import math

"""
Ideas:
+add dispersion using x position
-add dispersion from any direction
-add dispersion using spherical
+add texture to the solid filled objects - add to alpha surface then blit
+add random portion of the texture to each cell drawn
-add image to the solid filled objects or the outlined objects
"""

#Global variables
WIDTH = 1000
HEIGHT = WIDTH # code currently assumes squares
XC = int(WIDTH/2)
YC = int(HEIGHT/2)
MARGIN = 50
BKCOLOR = pygame.Color('White')
running = True
drawing = True #True if drawing in a loop
clearscreen = True #True if the screen should clear in each loop
texture = False

#Setup screen
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH,HEIGHT,BKCOLOR)
mypal = myPalette('CoffeeGray')
pygame.font.init()
font = pygame.font.SysFont('Arial',12)
text = font.render('cmARTcreations.com - (c) 2022', True, pygame.Color('Black'))
textRect = text.get_rect()
textRect.center = (WIDTH - 120, HEIGHT - MARGIN+10)

textureimg = pygame.image.load('textures/metal1.jpg').convert()
textureimg = pygame.transform.scale(textureimg,(WIDTH,HEIGHT)) #not sure why this doesn't require 2 margin widths
opaque = False
textureimg.set_alpha(40) #

##########################
# define functions here
##########################
def checkoff(point):
    off = False
    if (point.x < 0):
        point.x = WIDTH
        off = True
    if (point.x > WIDTH):
        point.x = 0
        off = True
    if (point.y < 0):
        point.y = HEIGHT
        off = True
    if (point.y > HEIGHT):
        point.y = 0
        off = True
    return off, point
    
def drawcircuit(surf):
    point = pygame.Vector2(randint(0,WIDTH),randint(0,HEIGHT))
    lastpoint = point
    pygame.draw.circle(surf,mypal.pal[randint(0,mypal.lenpal-1)],point,8,4)
    dir = pygame.Vector2(0,1).rotate(randint(0,360))
    maxmag = 100
    for segment in range(100):
        if random() <= .6:
            dir = dir.rotate(randint(0,3)*90)
        point = point + dir * randint(10,maxmag)
        off, point = checkoff(point)
        if not off:
            pygame.draw.line(surf,pygame.Color('Black'),lastpoint,point, 4)
        pygame.draw.circle(surf,mypal.pal[randint(0,mypal.lenpal-1)],point,9)
        lastpoint = point

def draw():
    #Primary draw routine
    if opaque:
        textureimg.set_alpha(255)
    else:
        textureimg.set_alpha(80)
    surf = pygame.Surface((WIDTH,HEIGHT), pygame.SRCALPHA)
    surf.fill(BKCOLOR)
    surf.blit(textureimg,(0,0)) # add the background

    drawcircuit(surf)

    pyG1.screen.blit(surf,(0,0))
    pyG1.screen.blit(text,textRect)
    pygame.display.flip()
    return

###########################
#      Main Program
###########################
while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(BKCOLOR) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        pyG1.clock.tick(1) #set framerate
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
        if event.type == KEYDOWN and event.key == pygame.K_o: #opaque texture
            opaque = not opaque
        if event.type == KEYDOWN and event.key == pygame.K_t: #texture toggle
            texture = not texture
        if event.type == KEYDOWN and event.key == pygame.K_d: #dispersion from center toggle
            disperse = not disperse
        if event.type == KEYDOWN and event.key == pygame.K_w: #white background
            BKCOLOR = pygame.Color('White')
        if event.type == KEYDOWN and event.key == pygame.K_b: #black background
            BKCOLOR = pygame.Color('Black')
        if event.type == KEYDOWN and event.key == pygame.K_m: #mixed up texture
            mixedup = not mixedup
        if event.type == KEYDOWN and event.key == pygame.K_s: #save image
            dt = datetime.now()
            pygame.image.save(pyG1.screen,'images/' + 'grid_' + dt.strftime("%Y%m%d_%H%M%S") + '.jpg')

pygame.quit()
exit()