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
        self.mass = r*10
        self.color = color
        self.maxvel = 1
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(randint(-self.maxvel,self.maxvel),randint(-self.maxvel,self.maxvel))
        if self.vel == (0,0):
            self.vel = pygame.Vector2(1,1)
        #self.vel = pygame.Vector2(0,self.maxvel)
        self.damping = 0.001

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
    
    def gravity(self,particle):
        """Need a gravity function"""
        d = pygame.math.Vector2.magnitude(self.pos - particle.pos)
        if (d > 10 and d < self.mass*2):
            #s = d / self.mass
            #f = 1 / pow(s, 1) - 1
            #f = f / self.mass
            f = self.mass*.01 / d
            particle.vel += (self.pos - particle.pos) * f

    def display(self,surf,transp = True):
        if transp == True:
            pygame.draw.circle(surf,self.color[0:3] + (40,),self.pos,self.radius)
        else:
            pygame.draw.circle(surf,self.color,self.pos,self.radius)

class Attractor():
    def __init__(self, x,y, r=200):
        self.pos = pygame.Vector2(x,y)
        self.radius = r

    def attract(self,particle):
        d = pygame.math.Vector2.magnitude(self.pos - particle.pos)
        if (d > 0 and d < self.radius*1.5):
            s = d/self.radius
            f = 1 / pow(s, 1) - 1
            f = f / self.radius
            particle.vel += -(self.pos - particle.pos) * f


