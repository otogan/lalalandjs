namespace SpriteKind {
    export const Building = SpriteKind.create()
    export const Props = SpriteKind.create()
    export const Vehicle = SpriteKind.create()
}
function setCarDrive(setCarDriveOn: boolean) {
    carControlOn = setCarDriveOn
    if (setCarDriveOn) {
        animation.runImageAnimation(
            car,
            getCarAnimation(carDirection),
            100,
            true
        )
        scene.cameraFollowSprite(car)
    } else {
        animation.stopAnimation(animation.AnimationTypes.All, car)
        car.setVelocity(0, 0)
        car.setImage(getCarImage(carDirection))
    }
}
function setCar(setCarLocation: tiles.Location, setCarDirection: string) {
    carDirection = setCarDirection
    carLocation = setCarLocation
    car = sprites.create(getCarImage(setCarDirection), SpriteKind.Vehicle)
    tiles.placeOnTile(car, setCarLocation)
    setCarDrive(false)
}
sprites.onOverlap(SpriteKind.Player, SpriteKind.Vehicle, function (sprite, otherSprite) {
    otherSprite.sayText("Press \"A\"", 500, false)
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileHouseBlue`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Building)
    sprites.destroyAllSpritesOfKind(SpriteKind.Vehicle)
    setHouseBlueProps()
    tiles.placeOnTile(sprite, tiles.getTilesByType(assets.tile`tileDoor0`)[0].getNeighboringLocation(CollisionDirection.Top))
    hero.z = 100
})
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileDoor1`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Props)
    setLevel1Props()
    tiles.placeOnTile(sprite, tiles.getTilesByType(assets.tile`tileHouseRed`)[0].getNeighboringLocation(CollisionDirection.Bottom))
})
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (carControlOn) {
        setCarDrive(false)
        setHero(car.tilemapLocation())
    } else if (hero.overlapsWith(car)) {
        car.sayText("", 1, false)
        sprites.destroy(hero)
        setCarDrive(true)
    } else {

    }
})
function setHouseRedProps() {
    tiles.setCurrentTilemap(tilemap`levelRedHouse`)
    prop = createProp(assets.image`furnitureRug`, 9, 7, false, false)
    prop = createProp(assets.image`furnitureTable2`, 5, 8, false, false)
    prop = createProp(assets.image`couchSide1`, 12, 7, false, true)
    prop = createProp(assets.image`bed2`, 4, 4, false, false)
    prop = createProp(assets.image`largeShelf`, 11, 3, false, false)
    prop = createProp(assets.image`smallShelf0`, 5, 3, false, false)
    prop = createProp(assets.image`couchFront1`, 9, 5, false, false)
}
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileDoor0`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Props)
    setLevel1Props()
    tiles.placeOnTile(sprite, tiles.getTilesByType(assets.tile`tileHouseBlue`)[0].getNeighboringLocation(CollisionDirection.Bottom))
})
function setHouseBlueProps() {
    tiles.setCurrentTilemap(tilemap`levelBlueHouse`)
    prop = createProp(assets.image`furnitureRug`, 9, 8, false, false)
    prop = createProp(assets.image`furnitureTable2`, 6, 8, false, false)
    prop = createProp(assets.image`couchSide1`, 4, 8, false, false)
    prop = createProp(assets.image`bed2`, 12, 4, false, false)
    prop = createProp(assets.image`largeShelf`, 5, 3, false, false)
    prop = createProp(assets.image`smallShelf0`, 11, 3, false, false)
    prop = createProp(assets.image`couchSide1`, 12, 8, false, true)
    prop = createProp(assets.image`tv`, 8, 3, false, false)
}
function updateHeroControl() {
    if (heroControlOn) {
        if (controller.up.isPressed()) {
            if (heroDirection != "up") {
                animation.runImageAnimation(
                    hero,
                    assets.animation`princessWalkBack`,
                    100,
                    true
                )
            }
            heroDirection = "up"
        } else if (controller.down.isPressed()) {
            if (heroDirection != "down") {
                animation.runImageAnimation(
                    hero,
                    assets.animation`princessWalkFront`,
                    100,
                    true
                )
            }
            heroDirection = "down"
        } else if (controller.right.isPressed()) {
            if (heroDirection != "right") {
                animation.runImageAnimation(
                    hero,
                    assets.animation`princessWalkRight`,
                    100,
                    true
                )
            }
            heroDirection = "right"
        } else if (controller.left.isPressed()) {
            if (heroDirection != "left") {
                animation.runImageAnimation(
                    hero,
                    assets.animation`princessWalkLeft`,
                    100,
                    true
                )
            }
            heroDirection = "left"
        } else {
            animation.stopAnimation(animation.AnimationTypes.All, hero)
            if (heroDirection == "up") {
                hero.setImage(assets.image`princessBack0`)
            } else if (heroDirection == "down") {
                hero.setImage(assets.image`princessFront0`)
            } else if (heroDirection == "right") {
                hero.setImage(assets.image`princessRight0`)
            } else if (heroDirection == "left") {
                hero.setImage(assets.image`princessLeft0`)
            }
            heroDirection = ""
        }
    }
}
function updateCarControl() {
    if (carControlOn) {
        if (controller.up.isPressed()) {
            if (car.vy >= 0) {
                animation.runImageAnimation(
                    car,
                    getCarAnimation("up"),
                    100,
                    true
                )
            }
            carDirection = "up"
            car.setVelocity(0, -1 * carSpeed)
        } else if (controller.down.isPressed()) {
            if (car.vy <= 0) {
                animation.runImageAnimation(
                    car,
                    getCarAnimation("down"),
                    100,
                    true
                )
            }
            carDirection = "down"
            car.setVelocity(0, carSpeed)
        } else if (controller.right.isPressed()) {
            if (car.vx <= 0) {
                animation.runImageAnimation(
                    car,
                    getCarAnimation("right"),
                    100,
                    true
                )
            }
            carDirection = "right"
            car.setVelocity(carSpeed, 0)
        } else if (controller.left.isPressed()) {
            if (car.vx >= 0) {
                animation.runImageAnimation(
                    car,
                    getCarAnimation("left"),
                    100,
                    true
                )
            }
            carDirection = "left"
            car.setVelocity(-1 * carSpeed, 0)
        } else {
            animation.stopAnimation(animation.AnimationTypes.All, car)
            car.setVelocity(0, 0)
        }
        carLocation = car.tilemapLocation()
        if (tiles.tileAtLocationEquals(car.tilemapLocation(), assets.tile`tileGrass1`)) {
            carSpeed = 20
        } else {
            carSpeed = 50
        }
    }
}
function setHero(setHeroLocation: tiles.Location) {
    hero = sprites.create(assets.image`princessFront0`, SpriteKind.Player)
    controller.moveSprite(hero, 30, 30)
    scene.cameraFollowSprite(hero)
    hero.z = 100
    tiles.placeOnTile(hero, setHeroLocation)
    heroControlOn = true
}
function getCarAnimation(carAnimationDirection: string) {
    if (carAnimationDirection == "up") {
        return assets.animation`car3Back`
    } else if (carAnimationDirection == "down") {
        return assets.animation`car3Front`
    } else if (carAnimationDirection == "right") {
        return assets.animation`car3Right`
    } else {
        return assets.animation`car3Left`
    }
}
function getCarImage(carImageDirection: string) {
    if (carImageDirection == "up") {
        return assets.image`carRedBack`
    } else if (carImageDirection == "down") {
        return assets.image`carRedFront`
    } else if (carImageDirection == "right") {
        return assets.image`carRedRight`
    } else {
        return assets.image`carRedLeft`
    }
}
function createProp(propImage: Image, propCol: number, propRow: number, flipV: boolean, flipH: boolean) {
    if (flipV) {
        propImage.flipY()
    }
    if (flipH) {
        propImage.flipX()
    }
    prop = sprites.create(propImage, SpriteKind.Props)
    tiles.placeOnTile(prop, tiles.getTileLocation(propCol, propRow))
    prop.x += (prop.width - 16) / 2
    prop.y += (prop.height - 16) / 2
    return prop
}
scene.onOverlapTile(SpriteKind.Player, assets.tile`tileHouseRed`, function (sprite, location) {
    sprites.destroyAllSpritesOfKind(SpriteKind.Building)
    sprites.destroyAllSpritesOfKind(SpriteKind.Vehicle)
    setHouseRedProps()
    tiles.placeOnTile(sprite, tiles.getTilesByType(assets.tile`tileDoor1`)[0].getNeighboringLocation(CollisionDirection.Top))
    hero.z = 100
})
function setLevel1Props() {
    tiles.setCurrentTilemap(tilemap`level1`)
    houseRed = sprites.create(assets.image`houseRed`, SpriteKind.Building)
    tiles.placeOnRandomTile(houseRed, assets.tile`tileHouseRed`)
    houseRed.y += -16
    houseBlue = sprites.create(assets.image`houseBlue`, SpriteKind.Building)
    tiles.placeOnRandomTile(houseBlue, assets.tile`tileHouseBlue`)
    houseBlue.y += -16
    setCar(carLocation, carDirection)
}
let houseBlue: Sprite = null
let houseRed: Sprite = null
let heroDirection = ""
let heroControlOn = false
let prop: Sprite = null
let hero: Sprite = null
let car: Sprite = null
let carDirection = ""
let carSpeed = 0
let carControlOn = false
let carLocation: tiles.Location = null
setHouseRedProps()
setHero(tiles.getTileLocation(7, 7))
carLocation = tiles.getTileLocation(6, 12)
carControlOn = false
carSpeed = 50
carDirection = "left"
forever(function () {
    updateHeroControl()
    updateCarControl()
})
