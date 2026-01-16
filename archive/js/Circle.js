// Class for a Circle

class Circle {

    constructor(x,y, r) {
        this.centerpos = createVector(x,y);
        this.r = r;
        this.angle = 0;
        this.point1 = createVector(cos(this.angle)*r+this.centerpos.x, sin(this.angle)*r + this.centerpos.y);
        this.angleinc = 2;
        this.color = palette[int(random(palette.length))];
        this.color.setAlpha(100);
        }
    
    show() {
        strokeWeight(5);
        this.color.setAlpha(100);
        stroke(this.color);
        point(this.point1.x, this.point1.y);
    }

    update() {
        this.angle = (this.angle + this.angleinc) % 360;
        this.point1.x = cos(this.angle)*this.r+this.centerpos.x;
        this.point1.y = sin(this.angle)*this.r+this.centerpos.y;
    }

    edges() {
        if (this.typeCheck == 'Window') {
            if (this.position.x > width) {
                this.position.x = 0;
            }
            if (this.position.x < 0) {
                this.position.x = width;
            }
            if (this.position.y > height) {
                this.position.y = 0;
            }
            if (this.position.y < 0) {
                this.position.y = height;
            }
        }   
        if (this.typeCheck == 'Bounce') {
            if (this.position.x < 0 || this.position.x > width) { this.velocity.x *= -1; };
            if (this.position.y < 0 || this.position.y > height) { this.velocity.y *= -1; };

        }
        if (this.typeCheck == 'Circle') {
        }
    }
}
