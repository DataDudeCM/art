from pygameinit import * #initialize pygrame, colors, etc.
from random import randint
import time
import numpy

#Set variables which determine how to draw
running = True #indicates whether the program should keep running
stilldrawing = True #indicates whether to keep drawing; can continue to run without drawing
polycolor = Color('blue') #set initial color of polygon
offset = 5 #range used to increase or decrease polygon vertex
polylinewidth = 2 #linewidth for the polygon; if 0, then fill polygon
clearscreen = True #Clears screen before drawing next polygon
maxdepth = 8

#List of points for polygon - starting in center of screen
numpoints = 2
points = [(((width / 2)-200),(height / 2)),(((width / 2)+200),(height / 2))]

def drawline(point1, point2, maxdepth):
    maxdepth = maxdepth - 1
    if maxdepth > 0:
        #find midpoint
        midx=(point2[0]-point1[0])/2+point1[0] #+ numpy.random.normal(0,.5)*offset
        midy=(point2[1]-point1[1])/2+point1[1] #+ numpy.random.normal(0,.5)*offset
        #move the midpoint offset -x pixels perpendicular  

        #drawline for segment 1
        drawline(point1,(midx,midy),maxdepth)
        #drawline for segment 2
        drawline((midx,midy),point2,maxdepth)
    else:
        pygame.draw.line(screen, polycolor, point1, point2, polylinewidth)
    return

#Main part of drawing program
screen.fill(WHITE)
while running:
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False
    if stilldrawing:
        #Update points

        #time.sleep(.0001)
        if clearscreen:
            screen.fill(WHITE)   
        #polycolor.hsla = (0,0,luminance,100)
        drawline(points[0],points[1], maxdepth)
        pygame.display.flip()
    stilldrawing = False

