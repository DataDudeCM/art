import pygame
import numpy as np
from pygame.locals import *
from random import *
from perlin_noise import PerlinNoise
from corefuncs import remap
from coreClasses import *
import math

"""
  Based onPage 394 in Gen Design book
"""

class Particle():
    def __init__(self, width, height, margin, x,y, color, r=2, s=2):
        self.width = width
        self.height = height
        self.margin = margin
        self.minX = margin
        self.maxX = self.width - margin
        self.minY = margin
        self.maxY = self.height - margin
        self.radius = r #size of circle
        self.color = color
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(randint(-3,3),randint(-3,3))
        self.damping = 0.0005

    def move(self):
        self.pos += self.vel
        #check for off screen
        if (self.pos.x < self.minX):
            self.pos.x = self.minX - (self.pos.x - self.minX)
            self.vel.x = -self.vel.x #reflect
        if (self.pos.x > self.maxX):
            self.pos.x = self.maxX - (self.pos.x - self.maxX)
            self.vel.x = -self.vel.x #reflect
        if (self.pos.y < self.minY):
            self.pos.y = self.minY - (self.pos.y - self.minY)
            self.vel.y = -self.vel.y #reflect
        if (self.pos.y > self.maxY):
            self.pos.y = self.maxY - (self.pos.y - self.maxY)
            self.vel.y = -self.vel.y #reflect

        self.vel *= (1-self.damping)

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


