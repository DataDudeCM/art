from rect import *

rect = Rect(100, 50, 50, 50)
v = [6, 4]
i = [3,2]

screen.fill(WHITE)

while running:
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False
    time.sleep(.0001)
    
    #rect.move_ip(v)
    #rect.inflate_ip(i)

    if rect.left < 0:
        v[0] *= -1
        i[0] *= -1
    if rect.right > width:
        v[0] *= -1
        i[0] *= -1
    if rect.top < 0:
        v[1] *= -1
        i[1] *= -1    
    if rect.bottom > height:
        v[1] *= -1
        i[1] *= -1

    rect.move_ip(v)
    rect.inflate_ip(i)

    screen.fill(WHITE)   
    pygame.draw.rect(screen, BLACK, rect, 2)
    pygame.display.flip()

pygame.quit()
