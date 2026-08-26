from pygameinit import * #initialize pygrame, colors, etc.
from random import randint
import time

#Set variables which determine how to draw
running = True #indicates whether the program should keep running
stilldrawing = True #indicates whether to keep drawing; can continue to run without drawing
polycolor = Color('blue') #set initial color of polygon
luminance = 0
luminance_increment = 0
offset = 1 #range used to increase or decrease polygon vertex
polylinewidth = 2 #linewidth for the polygon; if 0, then fill polygon
clearscreen = True #Clears screen before drawing next polygon

#List of points for polygon - starting in center of screen
numpoints = 4
points = []
for p in range(numpoints):
    points.append((width / 2, height / 2))

#Main part of drawing program
screen.fill(WHITE)
while running and stilldrawing:
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False
    if stilldrawing:
        #Update points
        index = -1
        for point in points:
            index = index + 1
            x = point[0] + randint(-offset,offset)
            y= point[1] + randint(-offset,offset)
            if x > width:
                x = width
            elif x < 0:
                x = 0
            if y > height:
                y = height
            elif y < 0:
                y = 0
            points[index] = (x,y)
        #time.sleep(.0001)
        if clearscreen:
            screen.fill(WHITE)   
        #polycolor.hsla = (0,0,luminance,100)
        pygame.draw.polygon(screen, polycolor, points, polylinewidth)
        pygame.display.flip()
        luminance = luminance + luminance_increment
        if luminance > 100:
            stilldrawing = False

