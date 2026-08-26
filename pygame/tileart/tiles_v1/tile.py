import pygame

def compareEdge(a,b):
    return a == b[::-1]
    #return a == b

class Tile():
    def __init__(self,img, edges):
        #Image
        self.img = img
        # Edges
        self.edges = edges # 0=top, 1=right, 2=down, 3=left
        # Valid neighbors
        self.up = []
        self.right = []
        self.down = []
        self.left = []

    ### May need to add index parameter and check for undefined

    def analyze(self, tiles):
        for i in range(len(tiles)):
            tile = tiles[i]
            #LEFT
            if compareEdge(tile.edges[1], self.edges[3]):
                self.left.append(i)
            #UP
            if compareEdge(tile.edges[2], self.edges[0]):
                self.up.append(i)
            #RIGHT
            if compareEdge(tile.edges[3], self.edges[1]):
                self.right.append(i)
            #DOWN
            if compareEdge(tile.edges[0], self.edges[2]):
                self.down.append(i)


    def rotate(self,num):
        #Draw new tile
        w = self.img.get_width()
        h = self.img.get_height()
        newImg = pygame.transform.rotate(self.img,num*-90)

        #rotate edges
        newEdges = []
        elen = len(self.edges)
        for i in range(elen):
            newEdges.append(self.edges[(i - num + elen) % elen])
        return Tile(newImg, newEdges)
    #function used to handle requests to print object
    def __repr__(self):
        return ("Edges: " + str(self.edges) + "  Up: " + str(self.up) + "  Down: " + str(self.down) 
        + "  Right: " + str(self.right) + "  Left: " + str(self.left))
