import numpy
import pygame
from random import randint

def lerp(a: float, b: float, t: float) -> float:
    """Linear interpolate on the scale given by a to b, using t as the point on that scale.
    Examples
    --------
        50 == lerp(0, 100, 0.5)
        4.2 == lerp(1, 5, 0.8)
    """
    return (1 - t) * a + t * b


def inv_lerp(a: float, b: float, v: float) -> float:
    """Inverse Linar Interpolation, get the fraction between a and b on which v resides.
    Examples
    --------
        0.5 == inv_lerp(0, 100, 50)
        0.8 == inv_lerp(1, 5, 4.2)
    """
    return (v - a) / (b - a)


def remap(i_min: float, i_max: float, o_min: float, o_max: float, v: float) -> float:
    """Remap values from one linear scale to another, a combination of lerp and inv_lerp.
    i_min and i_max are the scale on which the original value resides,
    o_min and o_max are the scale to which it should be mapped.
    Examples
    --------
        45 == remap(0, 100, 40, 50, 50)
        6.2 == remap(1, 5, 3, 7, 4.2)
    """
    return lerp(o_min, o_max, inv_lerp(i_min, i_max, v))

def chaikin_cut(a, b, ratio):
    x = 0.0
    y = 0.0
    n = []
    if (ratio > 0.5):
        ratio = 1 - ratio
    x = lerp(a.x, b.x, ratio)
    y = lerp(a.y, b.y, ratio)
    n.append(pygame.Vector2(x,y))
    x = lerp(b.x, a.x, ratio)
    y = lerp(b.y, a.y, ratio)
    n.append(pygame.Vector2(x,y))
    
    return n
    
#for interior vertices, split into two new vertices
def chaikin(surf, s, ratio, iterations, color, drawpoly = False, close = False):
    shapearr = []
    if (iterations == 0):
        return s
    shapelen = len(s)
    num_corners= shapelen #get number of elements in array
    
    if (not close):
        num_corners = shapelen - 1
        
    for i in range(num_corners):
        a = s[i]
        b = s[(i+1) % shapelen]
        n = chaikin_cut(a,b, ratio)
        if (not close and i == 0):
            shapearr.append(a)
            shapearr.append(n[1])
        elif (not close and i == (num_corners - 1)):
            shapearr.append(n[0])
            shapearr.append(b)
        else:
            shapearr.append(n[0])
            shapearr.append(n[1])

    #shape(shapearr,0,0)
 
    if iterations == 1:
        col = color
        w = 2
        pygame.draw.lines(surf,col, False, shapearr,w)
    elif drawpoly:
        col = color[0:3] + (50,)
        w = 0
        pygame.draw.polygon(surf, col, shapearr,w)
    return chaikin(surf, shapearr, ratio, iterations - 1, color)

def drawline(screen, polycolor, point1, point2, maxdepth, linewidth):
    #splits a line into maxdepth segments and adds roughness
    maxdepth = maxdepth - 1
    if maxdepth > 0:
        #find midpoint
        midx=(point2[0]-point1[0])/2+point1[0] + numpy.randint.normal(0,1)
        midy=(point2[1]-point1[1])/2+point1[1] + numpy.randint.normal(0,1)
        #move the midpoint offset -x pixels perpendicular  

        #drawline for segment 1
        drawline(screen, polycolor, point1,(midx,midy),maxdepth, linewidth)
        #drawline for segment 2
        drawline(screen, polycolor, (midx,midy),point2,maxdepth, linewidth)
    else:
        pygame.draw.line(screen, polycolor, point1, point2, linewidth)
    return


def artrect(s, c, v1, w, h): #consider adding optional default values

    numshapes = 10
    fuzzy = 8
    displace = 2
    v = []
    v.append(pygame.Vector2(v1.x,v1.y+h))
    v.append(v1)
    v.append(pygame.Vector2(v1.x+w,v1.y))
    v.append(pygame.Vector2(v1.x+w,v1.y+h))

    #Draw the lines between vertices
    for num in reversed(range(numshapes)):
        surf = pygame.Surface((s.get_width(),s.get_height()), pygame.SRCALPHA) #Need a new surface to daaw each shape
        if num < fuzzy: #thin normal lines
            if num == 0:
                linew = 2  #normally 2
                alpha = 255
            else:
                linew = int(remap(0,numshapes-1,1,1,num))
                alpha = int(remap(0,numshapes-1,200,1,num))
        else: #fat light opacity lines
            linew = 20
            alpha = 10
        for i in range (len(v)):
            if i == 0:
                pygame.draw.line(surf, c + (alpha,),(v[len(v)-1].x,v[len(v)-1].y),(v[0].x, v[0].y), width = linew)
                #pygame.draw.line(surf, c + (alpha,),(v[len(v)-1].x,v[len(v)-1)].y),(100,20), width = linew)
            else:
                pygame.draw.line(surf, c + (alpha,),(v[i-1].x, v[i-1].y), (v[i].x, v[i].y), width = linew)
        
        s.blit(surf,[0,0]) #blit surface to the main screen surface
        #displace each vertex by a randint amount 
        v[0] = v[0] + (randint(-displace,displace),randint(-displace,displace))
        v[1] = v[1] + (randint(-displace,displace),randint(-displace,displace))
        v[2] = v[2] + (randint(-displace,displace),randint(-displace,displace))
        v[3] = v[3] + (randint(-displace,displace),randint(-displace,displace))
