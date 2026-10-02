import pygame
from pygame.locals import *
from pygameinit import pyinit
import time
from random import randint
import colorsys

def hsb2rgb(hue, saturation, brightness, alpha):
    c=colorsys.hsv_to_rgb(hue/360,saturation/100, brightness/100)
    r=c[0]*255
    g=c[1]*255
    b=c[2]*255
    return (r, g, b, alpha)

WIDTH = 800
HEIGHT = 800
size = [WIDTH, HEIGHT]

#Setup screen
screen = pyinit(size)


running = True
drawing = True
screen.fill(Color('black'))

mycolor = Color('lightblue')
hue = mycolor.hsla[0]
saturation = mycolor.hsla[1]
brightness = mycolor.hsla[2]



while running:

    if drawing:
        #Draw stuff - will execute at least once
        background = pygame.Surface(size, pygame.SRCALPHA) #prepare a new background surface
        pygame.draw.line(background, hsb2rgb(hue,saturation,brightness,20), (randint(0,WIDTH),20),(0,randint(0,HEIGHT)), 4)
        screen.blit(background,(0,0)) #merge the background surface to the screen
       
        #pygame.draw.line(screen, (c[0]*255, c[1]*255,c[2]*255,randint(0,100)), (randint(0,WIDTH),20),(0,randint(0,HEIGHT)), 4)
        pygame.display.flip()
    
    #Wait for user to close screen
    for event in pygame.event.get():
        #If user closes window set running to False and quit
        if event.type == QUIT:
            running = False
        #If user presses 'f' then toggle whether the drawing function continues
        if event.type == KEYDOWN and pygame.K_f:
            drawing = not drawing
