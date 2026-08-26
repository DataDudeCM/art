import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import *
import time
from random import randint
import math

##########################
# define functions here
##########################
#function to return an array of colors and brightness
def imgcolarray(img, step):
    imgarray = []
    for j in range(math.floor(HEIGHT/step)): # change to divide by step
        for i in range(math.floor(WIDTH/step)):
            pixl = 0
            count = 0
            for b in range(step):
                for a in range(step):
                    if i+a <= WIDTH-1 and j+b <= HEIGHT-1:
                        count = count + 1
                        pixc = img.get_at((i*step+a,j*step+b))
                        #print(i,j,a,b,pixc)
                        pixl = pixl + pixc.hsla[2] # get lightness
                        #print(i,j,a,b,pixl)
            if count == 0:
                print('here')
            imgarray.append(pixl/count)
    return imgarray

def setup():
    global carimg
    global WIDTH, HEIGHT
    global running, drawing, clearscreen
    global pyG1
    #LOAD IMAGE
    carimg = pygame.image.load('images/car.jpg')
    WIDTH = 200
    HEIGHT = 100
    #WIDTH = carimg.get_width()
    #HEIGHT = carimg.get_height()
    running = True
    drawing = True #True if drawing in a loop
    clearscreen = False #True if the screen should clear in each loop
    #Setup screen
    pyG1 = pyGEnv()
    pyG1.createScreen(WIDTH,HEIGHT,'White')

def draw():
    #global carimg
    #Primary draw routine
    #Use pyG1.surface to enable transparency and alpha color parm
    simg = pygame.transform.scale(carimg,(WIDTH,HEIGHT))
    #pyG1.screen.blit(simg,[0,0])
    #step = int(remap(0,HEIGHT,1,10,pygame.mouse.get_pos()[1]))
    #print(step)
    step = 3
    c = pygame.Color('Black')
    lightness = 100
    larray = imgcolarray(simg,step)
    for j in range(math.floor(HEIGHT/step)):
        for i in range(math.floor(WIDTH/step)):
            #set lightness based on image brightness
            indx = int(i) + int(j*WIDTH/step)
            print(indx)
            lightness = larray[indx] #get the lightness part of the array
            c.hsla = (0,0,lightness,100)
            pygame.draw.rect(pyG1.screen,c,(i*step,j*step,step,step))
    pygame.display.flip()
    return

###########################
#      Main Program
###########################
setup()

while running:

    if drawing:
        #clearscreen
        if clearscreen:
            pyG1.screen.fill(pyG1.WHITE) #alternatively fill with a background image

        #Draw stuff - will execute at least once 
        draw()
        pyG1.clock.tick(60) #set framerate
        #to draw only once uncomment next line
        drawing = not drawing

    #Wait for user to close screen
    for event in pygame.event.get():
        #If user closes window set running to False and quit
        if event.type == QUIT:
            running = False
        #If user presses 'f' then toggle whether the drawing function continues
        if event.type == KEYDOWN and event.key == pygame.K_BACKSPACE:
            drawing = not drawing

pygame.quit()
exit()