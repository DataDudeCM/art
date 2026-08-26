class Cell():
    def __init__(self,value, i=0):
        self.collapsed = False
        self.drawn = False
        self.index = i

        if isinstance(value,list):
            self.options = value
        else:
            self.options = []
            for i in range(value):
                self.options.append(i)
    def __repr__(self):
        return "Collapsed: " + str(self.collapsed) + "  Options: " + str(self.options) + "  Index: " + str(self.index)