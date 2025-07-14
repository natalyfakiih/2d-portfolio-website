import { dialogueData } from "./constants.js";
import { displayDialogue, setCamScale } from "./functions.js";
import { k } from "./kaboom.js";
const zoomLevel = 0.5;

// load my character sprite
k.loadSprite("spritesheet", "./player.png", {
  sliceX: 4,
  sliceY: 3,
  anims: {
    "idle-down": 0,
    "walk-down": { from: 0, to: 3, loop: true, speed: 8 },
    "idle-side": 4,
    "walk-side": { from: 4, to: 7, loop: true, speed: 8 },
    "idle-up": 8,
    "walk-up": { from: 8, to: 11, loop: true, speed: 8 },
  },
});

// load home sprite
k.loadSprite("home", "./home.png");

k.loadSound("footstep", "/sounds/footsteps.mp3");
k.loadSound("typing", "/sounds/typing.mp3");
k.loadSound("bgm", "/sounds/background.mp3");

k.setBackground(k.Color.fromHex("#eadde9"));

k.scene("main", async () => {
  const homeData = await (await fetch("./home.json")).json();
  const layers = homeData.layers;

  // add home sprite with scaling
  const home = k.add([k.sprite("home"), k.pos(0, 0), k.scale(zoomLevel)]);

  const player = k.make([
    k.sprite("spritesheet", { anim: "idle-down" }),
    k.area({ shape: new k.Rect(k.vec2(0, 8), 32, 32) }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(0.8),
    { speed: 250, direction: "down", isInDialogue: false },
    "player",
  ]);

  for (const layer of layers) {
    if (layer.name === "boundaries" || layer.name === "objects") {
      for (const boundary of layer.objects) {
        // boundaries to home sprite so they scale with it
        k.add([
          k.area({
            shape: new k.Rect(
              k.vec2(0),
              boundary.width * zoomLevel,
              boundary.height * zoomLevel
            ),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x * zoomLevel - 95, boundary.y * zoomLevel - 30),

          boundary.name || "boundary",
        ]);

        if (boundary.name) {
          player.onCollide(boundary.name, () => {
            player.isInDialogue = true;
            displayDialogue(
              dialogueData[boundary.name],
              () => (player.isInDialogue = false)
            );
          });
        }
      }
    }

    if (layer.name === "spawnpoint") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            entity.x * zoomLevel - 95,
            entity.y * zoomLevel - 30
          );
          k.add(player);
        }
      }
    }
  }

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y - 100);
  });

  k.onMouseDown((mouseBtn) => {
    if (mouseBtn !== "left" || player.isInDialogue) return;

    const worldMousePos = k.toWorld(k.mousePos());
    player.moveTo(worldMousePos, player.speed);

    const mouseAngle = player.pos.angle(worldMousePos);

    const lowerBound = 50;
    const upperBound = 125;

    if (
      mouseAngle > lowerBound &&
      mouseAngle < upperBound &&
      player.curAnim() !== "walk-up"
    ) {
      player.play("walk-up");
      player.direction = "up";
      return;
    }

    if (
      mouseAngle < -lowerBound &&
      mouseAngle > -upperBound &&
      player.curAnim() !== "walk-down"
    ) {
      player.play("walk-down");
      player.direction = "down";
      return;
    }

    if (Math.abs(mouseAngle) > upperBound) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      return;
    }

    if (Math.abs(mouseAngle) < lowerBound) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      return;
    }
  });

  function stopAnims() {
    if (player.direction === "down") {
      player.play("idle-down");
      return;
    }
    if (player.direction === "up") {
      player.play("idle-up");
      return;
    }

    player.play("idle-side");
  }

  k.onMouseRelease(stopAnims);
  k.onKeyRelease(stopAnims);

  k.onKeyDown((key) => {
    const keyMap = [
      k.isKeyDown("right"),
      k.isKeyDown("left"),
      k.isKeyDown("up"),
      k.isKeyDown("down"),
    ];

    const nbOfKeyPressed = keyMap.filter(Boolean).length;

    if (nbOfKeyPressed > 1) return;

    if (player.isInDialogue) return;
    if (keyMap[0]) {
      player.flipX = false;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "right";
      player.move(player.speed, 0);
      return;
    }

    if (keyMap[1]) {
      player.flipX = true;
      if (player.curAnim() !== "walk-side") player.play("walk-side");
      player.direction = "left";
      player.move(-player.speed, 0);
      return;
    }

    if (keyMap[2]) {
      if (player.curAnim() !== "walk-up") player.play("walk-up");
      player.direction = "up";
      player.move(0, -player.speed);
      return;
    }

    if (keyMap[3]) {
      if (player.curAnim() !== "walk-down") player.play("walk-down");
      player.direction = "down";
      player.move(0, player.speed);
    }
  });
});

k.go("main");
