def setup():
    size(800,800)
    colorMode(HSB,360,100,100)
    background(0,0,80) #white
    noFill()

def chaikin_cut(a, b, ratio):
    x = 0.0
    y = 0.0
    n = []
    if (ratio > 0.5):
        ratio = 1 - ratio
    x = lerp(a.x, b.x, ratio)
    y = lerp(a.y, b.y, ratio)
    n.append((x,y))
    x = lerp(b.x, a.x, ratio)
    y = lerp(b.y, a.y, ratio)
    n.append((x,y))
    
    return n
    
#for interior vertices, split into two new vertices
def chaikin(s, ratio, iterations, close = False):
    if (iterations == 0):
        return s
    next = createShape()
    next.beginShape()
    num_corners= s.getVertexCount()
    
    if (not close):
        num_corners = s.getVertexCount() - 1
        
    for i in range(num_corners):
        a = s.getVertex(i)
        b = s.getVertex((i+1) % s.getVertexCount())
        n = chaikin_cut(a,b, ratio)
        if (not close and i == 0):
            next.vertex(a.x, a.y)
            next.vertex(n[1][0],n[1][1])
        elif (not close and i == (num_corners - 1)):
            next.vertex(n[0][0], n[0][1])
            next.vertex(b.x, b.y)
        else:
            next.vertex(n[0][0], n[0][1])
            next.vertex(n[1][0], n[1][1])
    
    if (close):
        next.endShape(CLOSE)
    else:
        next.endShape()
    if iterations == 1:
        next.setStrokeWeight(2)
        next.setStroke(color(0,0,0))
    else:
        next.setStrokeWeight(1)
        next.setStroke(color(180,100,80))
    shape(next,0,0)
    return chaikin(next, ratio, iterations - 1)

def draw():
    for n in range(1):
        stroke(180,100,80)
        y=width / 2
        index = -1
        flip = 1
        segments = 20
        deviation = 200
        giterations = 8
        points=[]
        segmentd = width / segments
    
        #Draw base jagged line
        s=createShape()
        s.beginShape()
        for i in range(segments+1):
            index += 1
            #points.append((i*segmentd, y+random(deviation)*flip))
            points.append((random(0,width),random(0,height)))
            s.vertex(points[index][0],points[index][1])
            flip *= -1
        s.endShape()
        shape(s,0,0)
        chaikin(s, .25, giterations)
        noLoop()
    
