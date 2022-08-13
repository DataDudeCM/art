import pygame
from pygame.locals import *

def pyinit(size):

    pygame.init()
    screen = pygame.display.set_mode(size)
    font = pygame.font.Font(None, 24)
    return screen