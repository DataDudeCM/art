import pygame
import numpy as np
from pygame.locals import *
from random import *
from perlin_noise import PerlinNoise
from corefuncs import remap
from coreClasses import *
import math

class Particle():
    def __init__(self, width, height, color, palname, r=2, s=1):
        self.width = width
        self.height = height
        self.radius = r #size of circle
        self.color = color
        self.palette = myPalette(palname)
        self.noise = PerlinNoise(octaves=8, seed=2)
        self.pos = pygame.Vector2(int(randint(0,self.width)), int(randint(0,self.height)))
        #self.pos = pygame.Vector2(self.width*.5, int(randint(0,self.height)))
        #self.pos = pygame.Vector2(int(randint(0,self.width)), self.height*.5)
        self.speed = .01+random()*s
        self.vel = pygame.Vector2(0,1).rotate(randint(0,360))*self.speed
        self.o = 0

    def resetNoise(self):
        self.o += 1 
        print(self.o)
        self.noise = PerlinNoise(octaves = self.o % 10+1, seed=2)

    def applyNoise(self,noise):
        mousepos = pygame.mouse.get_pos()     
        noiseFactor = self.width
        n = noise([self.pos.x/noiseFactor,self.pos.y/noiseFactor,mousepos[0]/noiseFactor])
        #angle = remap(-1,1,0,2*math.pi,n) # Forces velocity vector to follow the perlin noise
        angle = remap(-1,1,-5,5,n) # Uses the noise to nudge 
        #self.color = self.palette.pal[math.floor(math.degrees(angle)/90)] #changes color based on angle
        #self.vel = pygame.Vector2(math.cos(angle),math.sin(angle))*self.speed
        self.vel = pygame.Vector2.rotate(self.vel, angle)


    def move(self):
        self.pos += self.vel
        #check for off screen
        if (self.pos.x < 0):
            self.pos.x = self.width - 1
        if (self.pos.x >= self.width):
            self.pos.x = 0
            
        if (self.pos.y < 0):
            self.pos.y = self.height - 1
        if (self.pos.y >= self.height):
            self.pos.y = 0

    def display(self,surf,transp = True, colorover = pygame.Color('White')):
        if colorover == pygame.Color('White'): #if color not passed in use particle color
            if transp == True:
                pygame.draw.circle(surf,self.color[0:3] + (40,),self.pos,self.radius)
            else:
                pygame.draw.circle(surf,self.color,self.pos,self.radius)
                #pygame.draw.circle(surf,pygame.Color('Black'),self.pos,self.radius,1) #adds outline circle
        else:
            if transp == True:
                pygame.draw.circle(surf,colorover[0:3] + (40,),self.pos,self.radius)
            else:
                pygame.draw.circle(surf,colorover,self.pos,self.radius)


