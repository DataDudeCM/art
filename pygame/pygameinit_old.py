import pygame
from pygame.locals import *

width = 1000
height = 1000

RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

YELLOW = (255, 255, 0)
MAGENTA = (255, 0, 255)
CYAN = (0, 255, 255)

BLACK = (0, 0, 0)
GRAY = (150, 150, 150)
WHITE = (255, 255, 255)

pygame.init()
screen = pygame.display.set_mode((width, height))
font = pygame.font.Font(None, 24)