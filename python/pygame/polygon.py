from pygameinit_old import * #initialize pygrame, colors, etc.
from random import randint
import time
import math
import numpy

#Set variables which determine how to draw
running = True #indicates whether the program should keep running
stilldrawing = True #indicates whether to keep drawing; can continue to run without drawing
polycolor = Color('black') #set initial color of polygon
luminance = 0
luminance_increment = 0
offset = 1 #range used to increase or decrease polygon vertex
polylinewidth = 2 #linewidth for the polygon; if 0, then fill polygon
clearscreen = True #Clears screen before drawing next polygon
#origin
OX = width / 2
OY = height / 2

SEGMENTS=4

def polygon(sides,sz):
    CX = randint(0,width)
    CY = randint(0,height)
    points = []
    newpoints = []
    step = math.radians(360/sides)
    for i in range(sides):
       points.append((sz*math.cos(i*step)+CX, sz*math.sin(i*step)+CY))
    for a in range(len(points)):
        if a < len(points)-1:
            roughedge(points[a],points[a+1],SEGMENTS, newpoints)
        else:
            roughedge(points[a],points[0],SEGMENTS, newpoints)
    #pygame.draw.polygon(screen, (151,151,151,4), newpoints)
    pygame.draw.polygon(screen, (0,0,0), newpoints, polylinewidth)
    return

def roughedge(point1, point2, maxdepth, newpoints):
    maxdepth = maxdepth - 1
    #find midpoint
    midx=(point2[0]-point1[0])/2+point1[0] + numpy.random.normal(0,2)
    midy=(point2[1]-point1[1])/2+point1[1] + numpy.random.normal(0,2)
    if maxdepth > 0:
        #call roughedge twice, once for each new segment
        roughedge(point1, (midx,midy), maxdepth, newpoints)
        roughedge((midx,midy), point2, maxdepth, newpoints)
    else:
        #append the midpoint to newpoints
        newpoints.append((midx,midy))
    return


#Main part of drawing program
screen.fill(WHITE)

if clearscreen:
    screen.fill(WHITE)   
polygon(8,100)
pygame.display.flip()

while running:
    #screen.fill(WHITE)
    polygon(randint(8,20),randint(5,300))
    pygame.display.flip()
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False

