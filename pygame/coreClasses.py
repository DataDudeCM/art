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
        if palette == 'Blacks':
            self.pal.append(pygame.Color("#191919")) 
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
        if palette == 'BlueGray':
            self.pal.append(pygame.Color("#1b3af1")) #Navy
            self.pal.append(pygame.Color("#0541be")) #Ochre
            self.pal.append(pygame.Color("#8d8686")) #Burnt Sienna
            self.pal.append(pygame.Color("#f2f2f2")) #light gray
            self.pal.append(pygame.Color("#0d0d0d")) #light gray
        if palette == 'MonoGray':
            self.pal.append(pygame.Color("#d2d3c8")) #Navy
            self.pal.append(pygame.Color("#838683")) #Ochre
            self.pal.append(pygame.Color("#525b5e")) #Burnt Sienna
            self.pal.append(pygame.Color("#3f4749")) #light gray
            self.pal.append(pygame.Color("#272b2c")) #light gray
        if palette == 'CoffeeGray':
            self.pal.append(pygame.Color("#3f3f3d")) #Dark Gray
            self.pal.append(pygame.Color("#585957")) #Light Gray
            self.pal.append(pygame.Color("#5a2e13")) #Espresso
            self.pal.append(pygame.Color("#0c0c0a")) #Black
            self.pal.append(pygame.Color("#25261f")) #Light Black
        if palette == 'Seattle':
            self.pal.append(pygame.Color("#2fa146")) #Green
            self.pal.append(pygame.Color("#72b863")) #LightGreen
            self.pal.append(pygame.Color("#0071ab")) #SlateBlue
            self.pal.append(pygame.Color("#192221")) #Black
            self.pal.append(pygame.Color("#f0f0ee")) #Off White
        if palette == 'RedTeal':
            self.pal.append(pygame.Color("#fa190d")) #Red
            self.pal.append(pygame.Color("#e2e1e4")) #Offwhite
            self.pal.append(pygame.Color("#1c6770")) #DarkTeal
            self.pal.append(pygame.Color("#203e4f")) #DarkBlueGray
            self.pal.append(pygame.Color("#000000")) #PureBlack
        if palette == 'Basics':
            self.pal.append(pygame.Color("#0071ab")) #Blue
            self.pal.append(pygame.Color("#fe0a40")) #Red
            self.pal.append(pygame.Color("#fcd303")) #Yellow
            self.pal.append(pygame.Color("#7dd863")) #Green
            self.pal.append(pygame.Color("#000000")) #PureBlack
        if palette == 'MutedBasics':
            self.pal.append(pygame.Color("#1284a4")) #Blue
            self.pal.append(pygame.Color("#e8436c")) #Red
            self.pal.append(pygame.Color("#f1ca67")) #Yellow
            self.pal.append(pygame.Color("#08cf9f")) #Green
            self.pal.append(pygame.Color("#073b45")) #PureBlack
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
        self.screen.fill(bgcolor)

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
    


