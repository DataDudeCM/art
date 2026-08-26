"""
Chaikin Smoothing Mashup with Circuit Movement Logic
This script generates circuit-like paths using a random walk with 90-degree turns
and applies Chaikin smoothing to create organic, flowing lines.
Requires: coreClasses.py and corefuncs.py from the artfromcode repository.
"""
import pygame
from pygame.locals import *
from coreClasses import pyGEnv, myPalette
from corefuncs import chaikin, remap
from random import randint, random

# 1. Setup Environment using your pyGEnv class
WIDTH, HEIGHT = 1000, 1000
BKCOLOR = pygame.Color('DarkGray')
pyG1 = pyGEnv()
pyG1.createScreen(WIDTH, HEIGHT, BKCOLOR)
mypal = myPalette('MutedBasics') #

def get_circuit_path(num_segs):
    """Generates a list of points using your circuit movement logic."""
    point = pygame.Vector2(randint(0, WIDTH), randint(0, HEIGHT))
    path = [point]
    direction = pygame.Vector2(0, 1).rotate(randint(0, 360))
    max_mag = 150
    
    for _ in range(num_segs):
        # 80% chance to turn at 90-degree increments (Circuit Style)
        if random() <= 0.8:
            direction = direction.rotate(randint(0, 3) * 90)
        
        new_point = path[-1] + direction * randint(40, max_mag)
        
        # Boundary Check (Teleport logic from checkoff)
        if new_point.x < 0 or new_point.x > WIDTH or new_point.y < 0 or new_point.y > HEIGHT:
            break # End path if it goes off screen for cleaner curves
            
        path.append(new_point)
    return path

def draw():
    surf = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    surf.fill(BKCOLOR)
    
    # Create multiple circuit "branches"
    for _ in range(15):
        path_points = get_circuit_path(randint(5, 15))
        
        if len(path_points) > 2:
            # 2. Apply Chaikin Smoothing Mashup
            # ratio: 0.25, iterations: 5 (for high smoothness)
            color = mypal.pal[randint(0, mypal.lenpal-1)]
            chaikin(surf, path_points, 0.25, 5, color, linew=3)
            
            # Add nodes at the original joints for "Bio-Electronic" look
            for pt in path_points:
                pygame.draw.circle(surf, color, (int(pt.x), int(pt.y)), 5)

    pyG1.screen.blit(surf, (0, 0))
    pygame.display.flip()

# Main Loop
running = True
while running:
    draw()
    pygame.time.delay(1000) # Slow down to appreciate the generation
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False

pygame.quit()