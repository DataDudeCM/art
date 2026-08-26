from pygameinit_old import * #initialize pygrame, colors, etc.
from random import randint
import time
import math
import numpy

#Set variables which determine how to draw
running = True #indicates whether the program should keep running
stilldrawing = True #indicates whether to keep drawing; can continue to run without drawing
linecolor = Color('white') #set initial color of polygon
fillcolor = Color('black')
offset = 1 #range used to increase or decrease polygon vertex
polylinewidth = 1 #linewidth for the polygon; if 0, then fill polygon
clearscreen = False #Clears screen before drawing next polygon
#origin
OX = width / 2
OY = height / 2

def star(pointCount, innerRadius, outerRadius, rotationRatio,theta=0.0):
    theta = 0.0
    vertCount = pointCount*2
    thetaRot = math.pi*2/vertCount
    tempRadius = 0.0
    x = 0.0
    y = 0.0
    points = []

    for i in range(pointCount):
        for j in range(2):
            tempRadius = innerRadius

            if (j%2 == 0):
                tempRadius = outerRadius
            x = math.cos(theta+rotationRatio)*tempRadius + OX
            y = math.sin(theta+rotationRatio)*tempRadius + OY
            points.append((x,y))
            theta += thetaRot
    pygame.draw.polygon(screen, fillcolor, points)
    pygame.draw.polygon(screen, linecolor, points, polylinewidth)
    return


#Main part of drawing program
screen.fill(BLACK)

pointCount = 12
steps = 50
outerRadius=width*.5
innerRadiusFactor = .7
innerRadius = outerRadius*innerRadiusFactor
outerRadiusRatio = outerRadius/steps
innerRadiusRatio = innerRadius/steps
shadeRatio = 255.0 / steps
rotationRatio = 45.0 / steps

linecolor.a = 20 #doesn't work so need to blit a 2nd surface to be used for the outline

for i in range(steps):
    linecolor.r = int((shadeRatio*i))
    linecolor.g = int((shadeRatio*i))
    linecolor.b = int((shadeRatio*i))
    fillcolor.r = int(shadeRatio*i)
    fillcolor.g = int(shadeRatio*i)
    fillcolor.b = int(shadeRatio*i)

    if clearscreen:
        screen.fill(BLACK)   
    star(pointCount, outerRadius-outerRadiusRatio*i, innerRadius-innerRadiusRatio*i, rotationRatio*i*math.pi/180)
    pygame.display.flip()

while running:
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False

