class Cell():
    def __init__(self,value):
        self.collapsed = False

        if isinstance(value,list):
            self.options = value
        else:
            self.options = []
            for i in range(value):
                self.options.append(i)