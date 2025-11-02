enum Direction {
    N = 1,
    NE,
    E,
    SE,
    S,
    SW,
    W,
    NW,
}

namespace mgl {
    let spriteControllers: SpriteController[] = [];
    let spriteControllerCheck = false;

    function getDirection(ctrl: controller.Controller): Direction | undefined {
        if (ctrl.up.isPressed()) {
            if (ctrl.left.isPressed()) {
                return Direction.NW;
            } else if (ctrl.right.isPressed()) {
                return Direction.NE;
            } else {
                return Direction.N;
            }
        } else if (ctrl.down.isPressed()) {
            if (ctrl.left.isPressed()) {
                return Direction.SW;
            } else if (ctrl.right.isPressed()) {
                return Direction.SE;
            } else {
                return Direction.S;
            }
        } else if (ctrl.left.isPressed()) {
            return Direction.W;
        } else if (ctrl.right.isPressed()) {
            return Direction.E;
        }
        return undefined;
    }

    function onFrameUpdate() {
        const ctrl = controller._player1();

        let svx = (ctrl.right.isPressed() ? 256 : 0) - (ctrl.left.isPressed() ? 256 : 0);
        let svy = (ctrl.down.isPressed() ? 256 : 0) - (ctrl.up.isPressed() ? 256 : 0);

        let svxInCricle = svx;
        let svyInCircle = svy;

        // here svx/y are -256 to 256 range
        const sq = svx * svx + svy * svy;
        // we want to limit svx/y to be within circle of 256 radius
        const max = 256 * 256;
        // is it outside the circle?
        if (sq > max) {
            // if so, store the vector scaled down to fit in the circle
            const scale = Math.sqrt(max / sq);
            svxInCricle = (scale * svx) | 0;
            svyInCircle = (scale * svy) | 0;
        }

        spriteControllers.forEach((sc) => sc.__update(svx, svy, svxInCricle, svyInCircle, getDirection(ctrl)));
    }

    function registerFrameUpdate(): void {
        if (!spriteControllerCheck) {
            spriteControllerCheck = true;
            game.onUpdate(onFrameUpdate);
        }
    }

    export class UpdateCallback {
        constructor(public handler: (sprite: Sprite, direction: Direction, idleDirection: Direction) => void) {}
    }

    export class VelocityConditionCallback {
        constructor(public vx: number, public vy: number, public predicate: (sprite: Sprite) => boolean) {}
    }

    export class SpriteController {
        _inputLastFrame: boolean;
        _vx: number;
        _vy: number;
        _orgVX: number;
        _orvVY: number;
        _updateCallbacks: UpdateCallback[];
        _velocityConditionCallbacks: VelocityConditionCallback[];
        _idleAnimations: { [key: number]: Image[] };
        _idleAnimationFrameInterval: number;
        _idleAnimationLoop: boolean;
        _idleImages: { [key: number]: Image };
        _movingAnimations: { [key: number]: Image[] };
        _movingAnimationFrameInterval: number;
        _movingAnimationLoop: boolean;
        _movingImages: { [key: number]: Image };
        _controlling: boolean = true;
        _controllerDirection: Direction;
        _lastControllerDirection: Direction;
        _movingDirection: Direction;
        _lastMovingDirection: Direction;
        _idleDirection: Direction;
        _lastIdleDirection: Direction;

        constructor(public sprite: Sprite, vx: number, vy: number, direction: Direction, public moveDiagonal = true) {
            this._inputLastFrame = false;
            this._idleDirection = direction;
            this.vx = vx;
            this.vy = vy;
        }

        get direction(): Direction {
            return this._idleDirection || this._movingDirection;
        }

        set direction(direction: Direction) {
            if (this.isIdle()) {
                this._idleDirection = direction;
                this.__updateIdleSprite();
            }
        }

        get vx(): number {
            return this._vx;
        }

        set vx(vx: number) {
            this._orgVX = this._vx = vx;
        }

        get vy(): number {
            return this._vy;
        }

        set vy(vy: number) {
            this._orvVY = this._vy = vy;
        }

        isSpriteDestroyed(): boolean {
            return !!(this.sprite.flags & sprites.Flag.Destroyed);
        }

        isMoving(): boolean {
            return !!this._movingDirection;
        }

        isIdle(): boolean {
            return !this._movingDirection;
        }

        setControl(controlling: boolean) {
            this._controlling = controlling;
        }

        isControlled(): boolean {
            return this._controlling;
        }

        cameraFollow() {
            if (!this.isSpriteDestroyed()) {
                scene.cameraFollowSprite(this.sprite);
            }
        }

        onUpdate(handler: (sprite: Sprite, direction: Direction) => void): UpdateCallback | undefined {
            if (!handler) return undefined;
            if (!this._updateCallbacks) this._updateCallbacks = [];
            const callback = new UpdateCallback(handler);
            this._updateCallbacks.push(callback);
            return callback;
        }

        private __callUpdateCallbacks() {
            if (!this._updateCallbacks) return;
            this._updateCallbacks.forEach((cb) => cb.handler(this.sprite, this._movingDirection, this._idleDirection));
        }

        addVelocityCondition(
            vx: number,
            vy: number,
            predicate: (sprite: Sprite) => boolean
        ): VelocityConditionCallback | undefined {
            if (!predicate) return undefined;
            if (!this._velocityConditionCallbacks) this._velocityConditionCallbacks = [];
            const callback = new VelocityConditionCallback(vx, vy, predicate);
            this._velocityConditionCallbacks.push(callback);
            return callback;
        }

        removeVelocityCondition(callback: VelocityConditionCallback) {
            if (!callback) return;
            this._velocityConditionCallbacks = this._velocityConditionCallbacks.filter((cb) => cb !== callback);
        }

        private __updateVelocity() {
            if (!this._velocityConditionCallbacks) return;
            const cb = this._velocityConditionCallbacks.find((cb) => {
                return cb.predicate(this.sprite);
            });
            if (cb) {
                this._vx = cb.vx;
                this._vy = cb.vy;
            } else {
                this._vx = this._orgVX;
                this._vy = this._orvVY;
            }
        }

        setMovingImages(images: { [key: number]: Image }) {
            this._movingImages = images;
            this._movingAnimations = undefined;
            if (this.isMoving()) {
                this._lastMovingDirection = undefined;
                this.__updateMovingSprite();
            }
        }

        setMovingAnimations(animations: { [key: number]: Image[] }, frameInterval?: number, loop?: boolean) {
            this._movingAnimations = animations;
            this._movingAnimationFrameInterval = frameInterval;
            this._movingAnimationLoop = loop;
            this._movingImages = undefined;
            if (this.isMoving()) {
                this._lastMovingDirection = undefined;
                this.__updateMovingSprite();
            }
        }

        setIdleImages(images: { [key: number]: Image }) {
            this._idleImages = images;
            this._idleAnimations = undefined;
            if (this.isIdle()) {
                this._lastIdleDirection = undefined;
                this.__updateIdleSprite();
            }
        }

        setIdleAnimations(animations: { [key: number]: Image[] }, frameInterval?: number, loop?: boolean) {
            this._idleAnimations = animations;
            this._idleAnimationFrameInterval = frameInterval;
            this._idleAnimationLoop = loop;
            this._idleImages = undefined;
            if (this.isIdle()) {
                this._lastIdleDirection = undefined;
                this.__updateIdleSprite();
            }
        }

        private __updateMovingSprite() {
            if (this.isSpriteDestroyed() || !this._controlling) return;
            if (!this._movingDirection || this._movingDirection == this._lastMovingDirection) return;

            if (
                this.__updateSpriteAnimation(
                    this._movingDirection,
                    this._movingAnimations,
                    this._movingAnimationFrameInterval,
                    this._movingAnimationLoop
                )
            ) {
                return;
            }

            this.__updateSpriteImage(this._movingDirection, this._movingImages);
        }

        private __updateIdleSprite() {
            if (this.isSpriteDestroyed() || !this._controlling) return;
            if (!this._idleDirection || this._idleDirection == this._lastIdleDirection) return;

            if (
                this.__updateSpriteAnimation(
                    this._idleDirection,
                    this._idleAnimations,
                    this._idleAnimationFrameInterval,
                    this._idleAnimationLoop
                )
            ) {
                return;
            }

            this.__updateSpriteImage(this._idleDirection, this._idleImages);
        }

        private __updateSpriteAnimation(
            direction: Direction,
            animations: { [key: number]: Image[] },
            frameInterval?: number,
            loop?: boolean
        ): boolean {
            if (!animations) return false;
            let images: Image[];
            switch (direction) {
                case Direction.N:
                    images = animations[Direction.N];
                    break;
                case Direction.S:
                    images = animations[Direction.S];
                    break;
                case Direction.NE:
                    if ((images = animations[Direction.NE])) break;
                case Direction.SE:
                    if ((images = animations[Direction.SE])) break;
                case Direction.E:
                    images = animations[Direction.E];
                    break;
                case Direction.NW:
                    if ((images = animations[Direction.NW])) break;
                case Direction.SW:
                    if ((images = animations[Direction.SW])) break;
                case Direction.W:
                    images = animations[Direction.W];
                    break;
            }
            if (images) {
                animation.runImageAnimation(this.sprite, images, frameInterval, loop);
                return true;
            }
            return false;
        }

        private __updateSpriteImage(direction: Direction, images: { [key: number]: Image }): boolean {
            animation.stopAnimation(animation.AnimationTypes.ImageAnimation, this.sprite);

            if (!images) return false;
            let image: Image;
            switch (direction) {
                case Direction.N:
                    image = images[Direction.N];
                    break;
                case Direction.S:
                    image = images[Direction.S];
                    break;
                case Direction.NE:
                    if ((image = images[Direction.NE])) break;
                case Direction.SE:
                    if ((image = images[Direction.SE])) break;
                case Direction.E:
                    image = images[Direction.E];
                    break;
                case Direction.NW:
                    if ((image = images[Direction.NW])) break;
                case Direction.SW:
                    if ((image = images[Direction.SW])) break;
                case Direction.W:
                    image = images[Direction.W];
                    break;
            }
            if (image) {
                this.sprite.setImage(image);
                return true;
            }
            return false;
        }

        private __correctDirection(direction: Direction): Direction {
            if (this._vx && this._vy && !this.moveDiagonal) {
                if (direction == Direction.NE || direction == Direction.SE) {
                    return Direction.E;
                } else if (direction == Direction.NW || direction == Direction.SW) {
                    return Direction.W;
                }
            } else if (!this._vx) {
                if (direction == Direction.NE || direction == Direction.NW) {
                    return Direction.N;
                } else if (direction == Direction.SE || direction == Direction.SW) {
                    return Direction.S;
                } else if (direction == Direction.E || direction == Direction.W) {
                    return undefined;
                }
            } else if (!this._vy) {
                if (direction == Direction.NE || direction == Direction.SE) {
                    return Direction.E;
                } else if (direction == Direction.NW || direction == Direction.SW) {
                    return Direction.W;
                } else if (direction == Direction.N || direction == Direction.S) {
                    return undefined;
                }
            }
            return direction;
        }

        __update(svx: number, svy: number, svxInCricle: number, svyInCircle: number, direction: Direction) {
            if (this.sprite.flags & sprites.Flag.Destroyed) return;

            this.__updateVelocity();

            if (this._inputLastFrame) {
                if (this._vx) this.sprite._vx = Fx.zeroFx8;
                if (this._vy) this.sprite._vy = Fx.zeroFx8;
            }

            if (!this._controlling) return;

            this._lastControllerDirection = this._controllerDirection;
            this._controllerDirection = direction;
            direction = this.__correctDirection(direction);
            if (direction) {
                this._movingDirection = direction;
                this._idleDirection = undefined;
                this.__updateMovingSprite();
            } else {
                if (this._movingDirection) {
                    this._idleDirection = this._movingDirection;
                    this._movingDirection = undefined;
                }
                this.__updateIdleSprite();
            }

            if (svx || svy) {
                if (this._vx && this._vy && this.moveDiagonal) {
                    // if moving in both vx/vy use speed vector constrained to be within circle
                    this.sprite._vx = Fx.imul(svxInCricle as any as Fx8, this._vx);
                    this.sprite._vy = Fx.imul(svyInCircle as any as Fx8, this._vy);
                } else if (svx && this._vx) {
                    // otherwise don't bother
                    this.sprite._vx = Fx.imul(svx as any as Fx8, this._vx);
                } else if (svy && this._vy) {
                    this.sprite._vy = Fx.imul(svy as any as Fx8, this._vy);
                }
                this._inputLastFrame = true;
            } else {
                this._inputLastFrame = false;
            }
            this.__callUpdateCallbacks();
            this._lastMovingDirection = this._movingDirection;
            this._lastIdleDirection = this._idleDirection;
        }
    }

    export function controlSprite(
        sprite: Sprite,
        vx: number,
        vy: number,
        direction: Direction,
        diagonal = true
    ): SpriteController {
        registerFrameUpdate();
        const sc = new SpriteController(sprite, vx, vy, direction, diagonal);
        spriteControllers.push(sc);
        return sc;
    }
}
