namespace SpriteKind {
    export const Building = SpriteKind.create();
    export const Props = SpriteKind.create();
    export const Vehicle = SpriteKind.create();
}

class Hero {
    _ctrl: mgl.SpriteController;
    _idleImages: { [key: number]: Image } = {
        [Direction.N]: assets.image`princessBack0`,
        [Direction.S]: assets.image`princessFront0`,
        [Direction.E]: assets.image`princessRight0`,
        [Direction.W]: assets.image`princessLeft0`,
    };
    _movingAnimations: { [key: number]: Image[] } = {
        [Direction.N]: assets.animation`princessWalkBack`,
        [Direction.S]: assets.animation`princessWalkFront`,
        [Direction.E]: assets.animation`princessWalkRight`,
        [Direction.W]: assets.animation`princessWalkLeft`,
    };

    constructor() {
        this._ctrl = mgl.controlSprite(this.__getNewSprite(Direction.S), 30, 30, Direction.S);
        this._ctrl.sprite.z = 100;
        this._ctrl.setIdleImages(this._idleImages);
        this._ctrl.setMovingAnimations(this._movingAnimations, 100, true);
        this._ctrl.cameraFollow();
    }

    get sprite(): Sprite {
        return this._ctrl.sprite;
    }

    __getNewSprite(direction: Direction): Sprite {
        return sprites.create(this._idleImages[direction], SpriteKind.Player);
    }

    cameraFollow() {
        this._ctrl.cameraFollow();
    }

    destroy() {
        this._ctrl.sprite.destroy();
    }

    create() {
        if (!this._ctrl.isSpriteDestroyed()) return;
        this._ctrl.sprite = this.__getNewSprite(this._ctrl.direction);
    }

    placeOnTile(tileLocation: tiles.Location) {
        tiles.placeOnTile(this._ctrl.sprite, tileLocation);
    }
}

class Car {
    _ctrl: mgl.SpriteController;
    _location: tiles.Location;
    _idleImages0: { [key: number]: Image } = {
        [Direction.N]: assets.image`carRedBack`,
        [Direction.S]: assets.image`carRedFront`,
        [Direction.E]: assets.image`carRedRight`,
        [Direction.W]: assets.image`carRedLeft`,
    };
    _idleImages1: { [key: number]: Image } = {
        [Direction.N]: assets.image`car3Back0`,
        [Direction.S]: assets.image`car3Front0`,
        [Direction.E]: assets.image`car3Right0`,
        [Direction.W]: assets.image`car3Left0`,
    };
    _movingAnimations: { [key: number]: Image[] } = {
        [Direction.N]: assets.animation`car3Back`,
        [Direction.S]: assets.animation`car3Front`,
        [Direction.E]: assets.animation`car3Right`,
        [Direction.W]: assets.animation`car3Left`,
    };

    constructor() {
        this._ctrl = mgl.controlSprite(this.__getNewSprite(Direction.W), 50, 50, Direction.W, false);
        this._ctrl.setMovingAnimations(this._movingAnimations, 100, true);
        this._ctrl.setControl(false);
        this.placeOnTile(tiles.getTileLocation(6, 12))

        this._ctrl.onUpdate((sprite) => {
            if (this._ctrl.isSpriteDestroyed()) return;
            if (this._ctrl.isMoving()) {
                this._location = sprite.tilemapLocation();
            }
        });

        this._ctrl.addVelocityCondition(20, 20, (sprite) => {
            return tiles.tileAtLocationEquals(sprite.tilemapLocation(), assets.tile`tileGrass1`);
        })
    }

    get sprite(): Sprite {
        return this._ctrl.sprite;
    }

    __getNewSprite(direction: Direction): Sprite {
        return sprites.create(this._idleImages0[direction], SpriteKind.Vehicle);
    }

    cameraFollow() {
        this._ctrl.cameraFollow();
    }

    destroy() {
        this._ctrl.sprite.destroy();
    }

    create() {
        if (!this._ctrl.isSpriteDestroyed()) return;
        this._ctrl.sprite = this.__getNewSprite(this._ctrl.direction);
        tiles.placeOnTile(this._ctrl.sprite, this._location);
    }

    setDrive(driving: boolean) {
        if (driving) {
            this._ctrl.setIdleImages(this._idleImages1);
            this._ctrl.setControl(true);
            this.cameraFollow();
        } else {
            this._ctrl.setIdleImages(this._idleImages0);
            this._ctrl.setControl(false);
        }
    }

    isDriving() {
        return this._ctrl.isControlled() && !this._ctrl.isSpriteDestroyed();
    }

    getLocation(): tiles.Location {
        return this._location;
    }

    placeOnTile(tileLocation: tiles.Location) {
        this._location = tileLocation;
        tiles.placeOnTile(this._ctrl.sprite, tileLocation);
    }
}

function setCar() {
    if (car) {
        car.create();
    } else {
        car = new Car();
    }
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Vehicle, function (sprite, otherSprite) {
    otherSprite.sayText('Press "A"', 500, false);
});
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileHouseBlue`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Building);
    sprites.destroyAllSpritesOfKind(SpriteKind.Vehicle);
    setHouseBlueProps();
    tiles.placeOnTile(
        sprite,
        tiles.getTilesByType(assets.tile`tileDoor0`)[0].getNeighboringLocation(CollisionDirection.Top)
    );
    sprite.z = 100;
});
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileDoor1`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Props);
    setLevel1Props();
    tiles.placeOnTile(
        sprite,
        tiles.getTilesByType(assets.tile`tileHouseRed`)[0].getNeighboringLocation(CollisionDirection.Bottom)
    );
});
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!car) return;
    if (car.isDriving()) {
        car.setDrive(false);
        hero.create();
        hero.placeOnTile(car.getLocation());
        hero.cameraFollow();
    } else if (hero.sprite.overlapsWith(car.sprite)) {
        car.sprite.sayText('', 1, false);
        hero.destroy();
        car.setDrive(true);
    }
});
function setHouseRedProps() {
    tiles.setCurrentTilemap(tilemap`levelRedHouse`);
    let prop = createProp(assets.image`furnitureRug`, 9, 7, false, false);
    prop = createProp(assets.image`furnitureTable2`, 5, 8, false, false);
    prop = createProp(assets.image`couchSide1`, 12, 7, false, true);
    prop = createProp(assets.image`bed2`, 4, 4, false, false);
    prop = createProp(assets.image`largeShelf`, 11, 3, false, false);
    prop = createProp(assets.image`smallShelf0`, 5, 3, false, false);
    prop = createProp(assets.image`couchFront1`, 9, 5, false, false);
}
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileDoor0`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Props);
    setLevel1Props();
    tiles.placeOnTile(
        sprite,
        tiles.getTilesByType(assets.tile`tileHouseBlue`)[0].getNeighboringLocation(CollisionDirection.Bottom)
    );
});
function setHouseBlueProps() {
    tiles.setCurrentTilemap(tilemap`levelBlueHouse`);
    let prop = createProp(assets.image`furnitureRug`, 9, 8, false, false);
    prop = createProp(assets.image`furnitureTable2`, 6, 8, false, false);
    prop = createProp(assets.image`couchSide1`, 4, 8, false, false);
    prop = createProp(assets.image`bed2`, 12, 4, false, false);
    prop = createProp(assets.image`largeShelf`, 5, 3, false, false);
    prop = createProp(assets.image`smallShelf0`, 11, 3, false, false);
    prop = createProp(assets.image`couchSide1`, 12, 8, false, true);
    prop = createProp(assets.image`tv`, 8, 3, false, false);
}

function getCarAnimation(carAnimationDirection: string) {
    if (carAnimationDirection == "up") {
        return assets.animation`car3Back`;
    } else if (carAnimationDirection == "down") {
        return assets.animation`car3Front`;
    } else if (carAnimationDirection == "right") {
        return assets.animation`car3Right`;
    } else {
        return assets.animation`car3Left`;
    }
}
function getCarImage(carImageDirection: string) {
    if (carImageDirection == "up") {
        return assets.image`carRedBack`;
    } else if (carImageDirection == "down") {
        return assets.image`carRedFront`;
    } else if (carImageDirection == "right") {
        return assets.image`carRedRight`;
    } else {
        return assets.image`carRedLeft`;
    }
}
function createProp(propImage: Image, propCol: number, propRow: number, flipV: boolean, flipH: boolean) {
    if (flipV) {
        propImage.flipY();
    }
    if (flipH) {
        propImage.flipX();
    }
    let prop = sprites.create(propImage, SpriteKind.Props);
    tiles.placeOnTile(prop, tiles.getTileLocation(propCol, propRow));
    prop.x += (prop.width - 16) / 2;
    prop.y += (prop.height - 16) / 2;
    return prop;
}
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileHouseRed`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Building);
    sprites.destroyAllSpritesOfKind(SpriteKind.Vehicle);
    setHouseRedProps();
    tiles.placeOnTile(
        sprite,
        tiles.getTilesByType(assets.tile`tileDoor1`)[0].getNeighboringLocation(CollisionDirection.Top)
    );
    sprite.z = 100;
});
function setLevel1Props() {
    tiles.setCurrentTilemap(tilemap`level1`);
    houseRed = sprites.create(assets.image`houseRed`, SpriteKind.Building);
    tiles.placeOnRandomTile(houseRed, assets.tile`tileHouseRed`);
    houseRed.y += -16;
    houseBlue = sprites.create(assets.image`houseBlue`, SpriteKind.Building);
    tiles.placeOnRandomTile(houseBlue, assets.tile`tileHouseBlue`);
    houseBlue.y += -16;
    setCar();
}
let houseBlue: Sprite = null;
let houseRed: Sprite = null;
let hero: Hero = new Hero();
let car: Car = null;
setHouseRedProps();
hero.placeOnTile(tiles.getTileLocation(7, 7));
forever(function () {
});
