import pygame
import os

def compareEdge(a,b):
    return a == b[::-1]
    #return a == b

class Tile():
    def __init__(self,img, edges, weight=100):
        #Image
        self.img = img
        # Edges
        self.edges = edges # 0=top, 1=right, 2=down, 3=left
        # Valid neighbors
        self.up = []
        self.right = []
        self.down = []
        self.left = []
        self.weight = weight

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
        return Tile(newImg, newEdges, self.weight)
    #function used to handle requests to print object
    def __repr__(self):
        return ("Edges: " + str(self.edges) + "  Up: " + str(self.up) + "  Down: " + str(self.down) 
        + "  Right: " + str(self.right) + "  Left: " + str(self.left))

def setuptiles(tileset,tiles):
    tileImages = []

    # Get number of files
    dir_path = r'../tiles/'+tileset+'/'
    numtiles = 0
    # Iterate directory
    for path in os.listdir(dir_path):
        # check if current path is a file
        if os.path.isfile(os.path.join(dir_path, path)) and path.endswith(".png"):
            numtiles += 1

    #Load the images as surfaces
    for i in range(numtiles):
        tileImages.append(pygame.image.load('../tiles/'+tileset+'/' + str(i) + '.png').convert_alpha())

    match tileset:
        
        case "ironpipe":
            numsym = 2
            tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],25)) #corner
            tiles.append(Tile(tileImages[1], ["ABA", "ABA", "ABA", "ABA"],25)) #corner
            tiles.append(Tile(tileImages[2], ["AAA", "ABA", "AAA", "ABA"],25)) #corner
            tiles.append(Tile(tileImages[3], ["ABA", "AAA", "AAA", "ABA"],25)) #corner
            tiles.append(Tile(tileImages[4], ["ABA", "ABA", "ABA", "ABA"],10)) #corner
            tiles.append(Tile(tileImages[5], ["ABA", "ABA", "AAA", "ABA"],10)) #corner
        case "ArcanePipe":
            numsym = 0
            tiles.append(Tile(tileImages[0], ["ATA", "AAA", "AAA", "ATA"],25)) #corner
            tiles.append(Tile(tileImages[1], ["AAA", "ATA", "AAA", "ATA"],40)) #corner
            tiles.append(Tile(tileImages[2], ["ATA", "ATA", "AAA", "ATA"],15)) #corner
            tiles.append(Tile(tileImages[3], ["ATA", "ATA", "ATA", "ATA"],10)) #corner
            tiles.append(Tile(tileImages[4], ["ATA", "ATA", "ATA", "ATA"],10)) #corner
            tiles.append(Tile(tileImages[5], ["ATA", "AAA", "AAA", "TAA"],10)) #corner
            tiles.append(Tile(tileImages[6], ["AAA", "AAT", "AAA", "TAA"],10)) #corner
            tiles.append(Tile(tileImages[7], ["AAA", "ATA", "AAA", "TAA"],10)) #corner
        case "plumbing":
            numsym = 2
            tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],10)) #blank
            tiles.append(Tile(tileImages[1], ["TSA", "ATA", "AST", "ASA"],15)) #A = blank, S=small, T= thick
            tiles.append(Tile(tileImages[2], ["ASA", "AAA", "ASA", "AAA"],40)) #corner
            tiles.append(Tile(tileImages[3], ["ASA", "ASA", "ASA", "ASA"],20)) #corner
            tiles.append(Tile(tileImages[4], ["AAA", "ATA", "AAA", "ATA"],20)) #corner
            tiles.append(Tile(tileImages[5], ["TAA", "ASA", "AAA", "AAA"],20)) #corner
            tiles.append(Tile(tileImages[6], ["ATA", "ATA", "ATA", "ATA"],7)) #corner
            tiles.append(Tile(tileImages[7], ["AAA", "ASA", "AAT", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[8], ["ASA", "AAA", "ASA", "ASA"],10)) #corner
            tiles.append(Tile(tileImages[9], ["ASA", "AAA", "AAA", "ASA"],10)) #corner
            tiles.append(Tile(tileImages[10], ["AAA", "AAA", "AST", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[11], ["AAA", "AAA", "ASA", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[12], ["TAA", "AAA", "AAA", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[13], ["AAA", "AAA", "AAA", "ATA"],10)) #corner
            tiles.append(Tile(tileImages[14], ["ASA", "AAA", "AAA", "ATA"],10)) #corner
            tiles.append(Tile(tileImages[15], ["TSA", "AAA", "AAA", "AAA"],5)) #corner
            tiles.append(Tile(tileImages[16], ["ASA", "ATA", "AAA", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[17], ["TSA", "AAA", "AST", "ASA"],10)) #corner
            tiles.append(Tile(tileImages[18], ["TAA", "AAA", "AAA", "ASA"],10)) #corner
            tiles.append(Tile(tileImages[19], ["AAA", "TAA", "AAA", "AAT"],10)) #corner
            tiles.append(Tile(tileImages[20], ["TSA", "ASA", "AST", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[21], ["AAA", "AAA", "AAT", "ASA"],10)) #corner
            tiles.append(Tile(tileImages[22], ["AAA", "AAA", "AAT", "ATA"],10)) #corner
            tiles.append(Tile(tileImages[23], ["AAA", "ATA", "AAT", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[24], ["AAA", "ATA", "ATA", "AAA"],15)) #corner
            tiles.append(Tile(tileImages[25], ["SAA", "AAA", "AAS", "AAA"],20)) #corner
            tiles.append(Tile(tileImages[26], ["AAA", "AAS", "AAS", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[27], ["ASA", "AAA", "ATA", "AAA"],10)) #corner
            tiles.append(Tile(tileImages[28], ["ASA", "AAA", "ASA", "AAA"],5)) #vertical valve thin
            tiles.append(Tile(tileImages[29], ["AAA", "AAA", "ASA", "SAA"],10)) #vertical valve thin
        case "Subway":
            numsym = 6
            tiles.append(Tile(tileImages[0], ["BLB", "BLB", "BLB", "BLB"],30)) #corner
            tiles.append(Tile(tileImages[1], ["BLB", "BLB", "BLB", "BLB"],15)) #corner
            tiles.append(Tile(tileImages[2], ["BBB", "BBB", "BBB", "BBB"],100)) #corner
            tiles.append(Tile(tileImages[3], ["BLB", "BRB", "BLB", "BRB"],25)) #corner
            tiles.append(Tile(tileImages[4], ["BRB", "BRB", "BRB", "BRB"],20)) #corner
            tiles.append(Tile(tileImages[5], ["BRB", "BRB", "BRB", "BRB"],20)) #corner
            tiles.append(Tile(tileImages[6], ["BLB", "BLB", "BBB", "BLB"],5)) #corner
            tiles.append(Tile(tileImages[7], ["BBB", "BLB", "BBB", "BLB"],40)) #corner
            tiles.append(Tile(tileImages[8], ["BBB", "BLB", "BBB", "BLB"],20)) #corner
            tiles.append(Tile(tileImages[9], ["BBB", "BBB", "BBB", "BLB"],5)) #corner
            tiles.append(Tile(tileImages[10], ["BLB", "BLB", "BBB", "BLB"],25)) #corner
            tiles.append(Tile(tileImages[11], ["BLB", "BBB", "BBB", "BLB"],10)) #corner
            tiles.append(Tile(tileImages[12], ["BBB", "BRB", "BBB", "BRB"],30)) #corner
            tiles.append(Tile(tileImages[13], ["BBB", "BRB", "BBB", "BRB"],15)) #corner
            tiles.append(Tile(tileImages[14], ["BRB", "BRB", "BBB", "BRB"],10)) #corner
            tiles.append(Tile(tileImages[15], ["BRB", "BRB", "BBB", "BRB"],15)) #corner
            tiles.append(Tile(tileImages[16], ["BBB", "BBB", "BBB", "BRB"],5)) #corner
            tiles.append(Tile(tileImages[17], ["BRB", "BBB", "BBB", "BRB"],20)) #corner
            tiles.append(Tile(tileImages[18], ["BLB", "BRB", "BBB", "BRB"],10)) #corner

        case "hole":
            #hole images
            # Image, Edges, Probability
            numsym = 1
            tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],25)) #corner
            tiles.append(Tile(tileImages[1], ["AAA", "AAA", "BBB", "AAA"],75)) #cross
        case "Mondrian":
            #
            #Mondrian images
            # Image, Edges, Probability
            numsym = 8
            tiles.append(Tile(tileImages[0], ["YYY", "YYY", "YYY", "YYY"],30)) #corner
            tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"],20)) #cross
            tiles.append(Tile(tileImages[2], ["RRR", "RRR", "RRR", "RRR"],30)) #t
            tiles.append(Tile(tileImages[3], ["BBB", "BBB", "BBB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[4], ["LLL", "LLL", "LLL", "LLL"],30)) #corner
            tiles.append(Tile(tileImages[5], ["BBB", "BBB", "BBB", "BBB"],20)) #cross
            tiles.append(Tile(tileImages[6], ["WWW", "WWW", "WWW", "WWW"],50)) #t
            tiles.append(Tile(tileImages[7], ["BBB", "BBB", "BBB", "BBB"],15)) #t

            tiles.append(Tile(tileImages[8], ["BBB", "BYY", "YYB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[9], ["BYY", "YYY", "YYB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[10], ["BBB", "BRR", "RRB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[11], ["BRR", "RRR", "RRB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[12], ["BBB", "BLL", "LLB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[13], ["BLL", "LLL", "LLB", "BBB"],20)) #t
            tiles.append(Tile(tileImages[14], ["BBB", "BWW", "WWB", "BBB"],30)) #t
            tiles.append(Tile(tileImages[15], ["BWW", "WWW", "WWB", "BBB"],35)) #t
        case "circuit2":
                #Circuit images
            numsym = 2
            tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],200)) #blank grey
            tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"],30)) #blank green
            tiles.append(Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"],5)) #right only - light green
            tiles.append(Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"],20)) #straight horiz - white road
            tiles.append(Tile(tileImages[4], ["ABB", "BBB", "BBB", "BBA"],20)) #
            tiles.append(Tile(tileImages[5], ["BBB", "BCB", "BBB", "BCB"],40)) #straight horiz - light green road
            tiles.append(Tile(tileImages[6], ["BDB", "BCB", "BDB", "BCB"],10)) #
            tiles.append(Tile(tileImages[7], ["BDB", "BBB", "BCB", "BBB"],5)) #
            tiles.append(Tile(tileImages[8], ["BCB", "BCB", "BBB", "BCB"],20)) #
            tiles.append(Tile(tileImages[9], ["BCB", "BCB", "BCB", "BCB"],10)) #
            tiles.append(Tile(tileImages[10], ["BCB", "BCB", "BBB", "BBB"],40)) #
            tiles.append(Tile(tileImages[11], ["BBB", "BCB", "BBB", "BCB"],10)) #
            tiles.append(Tile(tileImages[12], ["ABB", "BCB", "BBA", "AAA"],40)) #
            tiles.append(Tile(tileImages[13], ["BDB", "BBB", "BDB", "BCB"],10)) #
            tiles.append(Tile(tileImages[14], ["BDB", "BCB", "BBB", "BCB"],10)) #
        case "circuit-coding-train":
                #Circuit images
            numsym = 2
            tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"],40)) #blank grey
            tiles.append(Tile(tileImages[1], ["BBB", "BBB", "BBB", "BBB"],10)) #blank green
            tiles.append(Tile(tileImages[2], ["BBB", "BCB", "BBB", "BBB"],10)) #right only - light green
            tiles.append(Tile(tileImages[3], ["BBB", "BDB", "BBB", "BDB"],30)) #straight horiz - white road
            tiles.append(Tile(tileImages[4], ["ABB", "BCB", "BBA", "AAA"],40)) #
            tiles.append(Tile(tileImages[5], ["ABB", "BBB", "BBB", "BBA"],10)) #
            tiles.append(Tile(tileImages[6], ["BBB", "BCB", "BBB", "BCB"],10)) #straight horiz - light green road
            tiles.append(Tile(tileImages[7], ["BDB", "BCB", "BDB", "BCB"],10)) #
            tiles.append(Tile(tileImages[8], ["BDB", "BBB", "BCB", "BBB"],5)) #
            tiles.append(Tile(tileImages[9], ["BCB", "BCB", "BBB", "BCB"],10)) #
            tiles.append(Tile(tileImages[10], ["BCB", "BCB", "BCB", "BCB"],10)) #
            tiles.append(Tile(tileImages[11], ["BCB", "BCB", "BBB", "BBB"],10)) #
            tiles.append(Tile(tileImages[12], ["BBB", "BCB", "BBB", "BCB"],10)) #
    
    """
    #
    #pipe images
    # Image, Edges, Probability
    tiles.append(Tile(tileImages[0], ["AAA", "ABA", "ABA", "AAA"],25)) #corner
    tiles.append(Tile(tileImages[1], ["ABA", "ABA", "ABA", "ABA"],25)) #cross
    tiles.append(Tile(tileImages[2], ["AAA", "ABA", "ABA", "ABA"],50)) #t
    """

    """Road images
    tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
    tiles.append(Tile(tileImages[0], ["AAA", "AAA", "AAA", "AAA"])) #blank
    tiles.append(Tile(tileImages[1], ["AAA", "ABA", "ABA", "ABA"])) #down facing
    tiles.append(Tile(tileImages[2], ["ABA", "AAA", "ABA", "ABA"])) #left facing
    tiles.append(Tile(tileImages[3], ["ABA", "ABA", "ABA", "AAA"])) #right facing
    tiles.append(Tile(tileImages[4], ["ABA", "ABA", "AAA", "ABA"])) #up facing
    """

    """

    """

    initialTileCount = len(tiles)
    for i in range(numsym,initialTileCount): # no need to rotate the 1st or 2nd tiles as they are squares
        for j in range(4):
            tiles.append(tiles[i].rotate(j))
            #tileweights.append(tileweights[i]) #apply the weight of the original tile to its rotations
    
    #for each tile, analyze it against all tiles
    for i in range(len(tiles)):
        tile = tiles[i]
        tile.analyze(tiles)
    
    return tiles
    