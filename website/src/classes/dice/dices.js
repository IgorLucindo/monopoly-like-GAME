import { Dice } from "./dice.js";


export class Dices {
  constructor() {
    this.list = [];
    this.draggingCount = 0;
    this.prevDraggingCount = 0;
    this.pos = {x: 0, y: 0};

    this.board = null;
  }


  init(variables, n) {
    this.getVariables(variables);
    this.createDices(variables, n);
    this.setInitialPos();
    this.createEvents();
  }


  getVariables(variables) {
    this.cfg = variables.cfg;
    this.database = variables.database;
    this.board = variables.board;
    this.match = variables.match;
    this.matchsv = variables.matchsv;
    this.screen = variables.screen;
  }


  createDices(variables, n) {
    for (let i = 0; i < n; i++) {
      const wrapper = document.createElement("div");
      wrapper.className = "dice-wrapper";
      wrapper.innerHTML = `<div class="dice-3d"><div class="face one"><span class="dot center"></span></div><div class="face two"><span class="dot top-left"></span><span class="dot bottom-right"></span></div><div class="face three"><span class="dot top-left"></span><span class="dot center"></span><span class="dot bottom-right"></span></div><div class="face four"><span class="dot top-left"></span><span class="dot top-right"></span><span class="dot bottom-left"></span><span class="dot bottom-right"></span></div><div class="face five"><span class="dot top-left"></span><span class="dot top-right"></span><span class="dot center"></span><span class="dot bottom-left"></span><span class="dot bottom-right"></span></div><div class="face six"><span class="dot top-left"></span><span class="dot top-right"></span><span class="dot mid-left"></span><span class="dot mid-right"></span><span class="dot bottom-left"></span><span class="dot bottom-right"></span></div></div>`;
      this.board.el.appendChild(wrapper);
      const dice = new Dice(wrapper);
      dice.init(variables);
      this.list.push(dice);
    }
  }


  setInitialPos() {
    const offsetX = this.board.left + this.board.width*0.4;
    const offsetY = this.board.top + this.board.height*0.4;
    const gap = this.list[0].size / 2;
    this.list.forEach((dice, index) => {
      dice.wrapper.style.left = `${offsetX + index*(dice.size + gap)}px`;
      dice.wrapper.style.top = `${offsetY}px`;
    });
  }


  createEvents() {
    // Mouse move event
    const mousemove = (e) => {
      if (!this.draggingCount) return;
      
      let index = 0;
      this.list.forEach((dice) => {
        if (!dice.isDragging) return;

        dice.updateMovement(e, index);
        dice.tilt();
        index += 1;
      });
      this.prevDraggingCount = this.draggingCount;
    }

    // Mouse up event
    const mouseup = () => {
      if (!this.draggingCount) return;
      this.screen.ungrab();

      let index = 0;
      const numbers = [];
      const dicesServer = [];

      // Roll each dragging dice
      this.list.forEach((dice) => {
        if (!dice.isDragging) return;

        dice.isDragging = false;
        dice.unlift();
        dice.setRamdomNumber();
        dice.number = 1 + index; // debug
        dice.roll(index);
        numbers.push(dice.number);
        dicesServer.push({ number: dice.number, pos: dice.pos, vel: dice.vel });
        index += 1;
      });

      // If is dragging all dices, play
      if (this.draggingCount === this.list.length) {
        this.match.playDiceTurn(numbers);
        const serverData = { dices: dicesServer, turnIdx: this.match.currentPlayerIndex };
        this.database.setField("rooms", this.match.gameData.roomName, serverData);
      }

      this.draggingCount = 0;
      this.prevDraggingCount = this.draggingCount;
    }

    // Create events
    if (!this.cfg.touch){
      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
    }
    else {
      document.addEventListener("touchmove", mousemove, { passive: true });
      document.addEventListener("touchend", mouseup);
    }
  }
}