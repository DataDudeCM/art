import pygame
import numpy as np
from pygame.locals import *
from random import *
from perlin_noise import PerlinNoise
from corefuncs import remap
import math

class myPalette():
    def __init__(self,palette):
        self.pal = []
        # Check https://digitalsynopsis.com/design/beautiful-color-gradient-palettes/ for more
        if palette == 'Primary':
            self.pal.append(pygame.Color("#90caf9")) 
            self.pal.append(pygame.Color("#42A5F5"))
            self.pal.append(pygame.Color("#2979FF"))
        if palette == 'TheBlues':
            self.pal.append(pygame.Color("#BEE6FF")) #light blue
            self.pal.append(pygame.Color("#2D82B5")) #powder blue
            self.pal.append(pygame.Color("#52A6D8")) #med blue
            self.pal.append(pygame.Color("#88CDF6")) #slate blue
            self.pal.append(pygame.Color("#BCE6FF")) #dark blue
            self.pal.append(pygame.Color("#16141c")) #Black
        if palette == 'PinkGray':
            self.pal.append(pygame.Color("#A8A7A7")) #light gray
            self.pal.append(pygame.Color("#CC527A")) #light magenta
            self.pal.append(pygame.Color("#E8175D")) #hotpink
            self.pal.append(pygame.Color("#474747")) #slate gray
            self.pal.append(pygame.Color("#363636")) #dark gray
            self.pal.append(pygame.Color("#16141c")) #Black
        if palette == 'Tan':
            self.pal.append(pygame.Color("#DDC3A5")) #Beige
            self.pal.append(pygame.Color("#201E20")) #black brown
            self.pal.append(pygame.Color("#E0A96D")) #Tan
        if palette == 'Khaki':
            self.pal.append(pygame.Color("#F6EAD4")) #Beige
            self.pal.append(pygame.Color("#A2A595")) #black brown
            self.pal.append(pygame.Color("#B4A284")) #Tan
            self.pal.append(pygame.Color("#16141c")) #Black
        if palette == 'Classic':
            self.pal.append(pygame.Color("#26495C")) #Navy
            self.pal.append(pygame.Color("#C4A35A")) #Ochre
            self.pal.append(pygame.Color("#C66B3D")) #Burnt Sienna
            self.pal.append(pygame.Color("#E5E5dc")) #light gray
        self.lenpal = len(self.pal)



class pyGEnv():
    """
    pyGEnv is a class used to setup the pyGame environment and default variables.
    """
    def __init__(self):
        self.width = 0
        self.height = 0
        self.w2 = 0 #screen width / 2
        self.h2 = 0 #screen height / 2
        self.screen = pygame.display.init()
        self.clock = pygame.time.Clock()
    
    def createScreen(self, w, h, bgcolor):
        self.width = w
        self.height = h
        self.w2 = self.width / 2 #screen width / 2
        self.h2 = self.height / 2 #screen height / 2
        self.screen = pygame.display.set_mode((w,h))
        self.screen.fill(pygame.Color(bgcolor))

class Particle():
    def __init__(self, width, height, color, palname, r=2, s=2):
        self.width = width
        self.height = height
        self.radius = r #size of circle
        self.color = color
        self.palette = myPalette(palname)
        self.noise = PerlinNoise(octaves=8, seed=2)
        self.pos = pygame.Vector2(int(randint(0,self.width)), int(randint(0,self.height)))
        self.speed = 1+random()*s
        self.vel = pygame.Vector2(0,1).rotate(randint(0,360))*self.speed
        self.o = 0

    def resetNoise(self):
        self.o += 1 
        self.noise = PerlinNoise(octaves = self.o % 10, seed=2)

    def applyNoise(self,noise):
        mousepos = pygame.mouse.get_pos()     
        noiseFactor = self.width
        n = noise([self.pos.x/noiseFactor,self.pos.y/noiseFactor,mousepos[0]/noiseFactor])
        angle = remap(-1,1,0,2*math.pi,n)
        #self.color = self.palette.pal[math.floor(math.degrees(angle)/90)]
        self.vel = pygame.Vector2(math.cos(angle),math.sin(angle))*self.speed

    def move(self):
        self.pos += self.vel
        #check for off screen
        if (self.pos.x < 0):
            self.pos.x = self.width
        if (self.pos.x > self.width):
            self.pos.x = 0
            
        if (self.pos.y < 0):
            self.pos.y = self.height
        if (self.pos.y > self.height):
            self.pos.y = 0

    def display(self,surf,transp = True):
        if transp == True:
            pygame.draw.circle(surf,self.color[0:3] + (40,),self.pos,self.radius)
        else:
            pygame.draw.circle(surf,self.color,self.pos,self.radius)
            #pygame.draw.circle(surf,pygame.Color('Black'),self.pos,self.radius,1) #adds outline circle
    


