/*
 * The canvas drawing code was adapted from https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse
 */

import "./style.css";
class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
// canvas.width = window.innerWidth - 500;
// canvas.height = window.innerHeight - 500;
const clearBtn = document.querySelector(
  '[data-btn="clear"]'
) as HTMLButtonElement;
const derivativeCheckbox = document.querySelector(
  '[data-checkbox="derivative"'
) as HTMLInputElement;
const integralCheckbox = document.querySelector(
  '[data-checkbox="integral"'
) as HTMLInputElement;
const aucSpan = document.querySelector("span[data-auc]") as HTMLSpanElement;
const derivativeSpan = document.querySelector(
  "span[data-derivative]"
) as HTMLSpanElement;
const xSpan = document.querySelector("span[data-x]") as HTMLSpanElement;
const ySpan = document.querySelector("span[data-y]") as HTMLSpanElement;

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
let boxWidth = 20;
const { width, height } = canvas;
let xAxis = width / 2;
let yAxis = 10 + height / 2;

let flag = false;
let prevX = 0;
let currX = 0;
let prevY = 0;
let currY = 0;
let dot_flag = false;

let gridX = 0;
let gridY = 0;
const roundingPrecision = 10000000;

let showDerivative = true;
const derivativeColor = "#f03e82";
let prevDerivative: number | null = null;
let derivativePoints: Point[] = [];
const derivativePrecision = 5;

let integral = 0;
let showIntegral = true;
const integralColor = "#f0d83e";

let penColor = "#13ba2c";
let penWidth = 4;
ctx.lineWidth = penWidth;
let integralPoints: Point[] = [{ x: 0, y: 0 }];
let numberOfPoints = 0;

canvas.addEventListener(
  "mousemove",
  (e) => {
    setDrawingCoords("move", e);
  },
  false
);
canvas.addEventListener(
  "mousedown",
  (e) => {
    setDrawingCoords("down", e);
  },
  false
);
canvas.addEventListener(
  "mouseup",
  (e) => {
    setDrawingCoords("up", e);
  },
  false
);
canvas.addEventListener(
  "mouseout",
  (e) => {
    setDrawingCoords("out", e);
  },
  false
);

canvas.addEventListener("wheel", (e) => {
  zoom(boxWidth * Math.E ** (e.deltaY / 1000));
});
integralCheckbox.addEventListener(
  "change",
  (e) => (showIntegral = (e.target as HTMLInputElement).checked)
);
derivativeCheckbox.addEventListener(
  "change",
  (e) => (showDerivative = (e.target as HTMLInputElement).checked)
);

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyC") clearBtn.click();
  if (e.code === "KeyR" && boxWidth !== 20) zoom(20);
  if (e.code === "KeyD") derivativeCheckbox.click();
  if (e.code === "KeyI") integralCheckbox.click();
});

erase();

clearBtn.addEventListener("click", erase);

function zoom(newSquareWidth: number) {
  boxWidth = newSquareWidth;
  boxWidth = Math.max(boxWidth, 8);
  boxWidth = Math.min(boxWidth, 70);

  if (boxWidth <= 15) penWidth = 1;
  else penWidth = 4;
  erase();
  drawGrid();
}

function draw() {
  ctx.strokeStyle = penColor;
  ctx.beginPath();
  ctx.moveTo(prevX, prevY);
  ctx.lineTo(currX, currY);
  ctx.stroke();
  ctx.closePath();

  const area = calcIntegral();
  const prevPoint = integralPoints.shift();
  const prevDerivPoint = derivativePoints[0];
  const lastDerivPoint = derivativePoints[derivativePrecision - 1];
  if (
    showDerivative &&
    prevDerivPoint &&
    lastDerivPoint &&
    derivativePoints.length > derivativePrecision
  ) {
    const derivative = calcDerivative();
    if (prevDerivative === null) prevDerivative = derivative;
    else if (derivative) {
      ctx.beginPath();
      ctx.strokeStyle = derivativeColor;
      ctx.moveTo(...gridToCanvas(prevDerivPoint.x, prevDerivative));
      ctx.lineTo(...gridToCanvas(lastDerivPoint.x, derivative));
      ctx.stroke();
      ctx.closePath();
      derivativeSpan.dataset.derivative = round(derivative).toString();
      prevDerivative = derivative;
    }
  }
  if (showIntegral && area && prevPoint) {
    ctx.beginPath();
    ctx.strokeStyle = integralColor;
    ctx.moveTo(...gridToCanvas(prevPoint.x, integral));
    integral += area;
    ctx.lineTo(...gridToCanvas(integralPoints[0].x, integral));
    ctx.stroke();
    ctx.closePath();
    aucSpan.dataset.auc = round(integral).toString();
  }
}

function erase() {
  ctx.clearRect(0, 0, width, height);
  drawGrid();
  integral = 0;
  integralPoints = [];
  derivativePoints = [];
  prevDerivative = null;
  derivativeSpan.dataset.derivative = "0";
  aucSpan.dataset.auc = "0";
  console.clear();
}

function setDrawingCoords(res: "down" | "up" | "out" | "move", e: MouseEvent) {
  gridX = (e.clientX - canvas.offsetLeft - xAxis) / boxWidth;
  gridY = (yAxis - e.clientY + canvas.offsetTop) / boxWidth;
  xSpan.dataset.x = round(gridX).toString();
  ySpan.dataset.y = round(gridY).toString();
  if (res == "down") {
    prevX = currX;
    prevY = currY;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;

    flag = true;
    dot_flag = true;
    if (dot_flag) {
      ctx.beginPath();
      ctx.fillStyle = penColor;
      ctx.fillRect(currX, currY, 2, 2);
      ctx.closePath();
      dot_flag = false;
      integralPoints.push({ x: gridX, y: gridY });
      derivativePoints.push(new Point(gridX, gridY));
      numberOfPoints++;
    }
  }
  if (res == "up" || res == "out") {
    flag = false;
  }
  if (res == "move") {
    if (flag) {
      prevX = currX;
      prevY = currY;
      currX = e.clientX - canvas.offsetLeft;
      currY = e.clientY - canvas.offsetTop;
      draw();
    }
  }
  if (flag) {
    // if (points[0] && points[0].x === gridX) points.shift();
    integralPoints.push(new Point(gridX, gridY));
    derivativePoints.push(new Point(gridX, gridY));
    numberOfPoints++;
    console.log(gridX, gridY);
    console.log("number of points: ", numberOfPoints);
  }
}

function round(x: number) {
  return Math.floor(x * roundingPrecision) / roundingPrecision;
}

function drawGrid() {
  const lineColor = "#646cff";
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = penWidth;
  ctx.beginPath();
  for (let x = 0; x < width; x += boxWidth) {
    if (x - width / 2 < boxWidth) xAxis = x;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += boxWidth) {
    if (y - height / 2 < boxWidth) yAxis = y;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.closePath();
  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.moveTo(xAxis, 0);
  ctx.lineTo(xAxis, height);
  ctx.moveTo(0, yAxis);
  ctx.lineTo(width, yAxis);
  ctx.stroke();
  ctx.closePath();
}

function calcDerivative(): number | null {
  console.log("calc derivative", JSON.stringify(derivativePoints));
  const pts = derivativePoints.splice(0, derivativePrecision);
  const p1 = pts[0];
  const p2 = pts[derivativePrecision - 1];
  if (!p1 || !p2 || p1.x === p2.x) return null;
  const dydx = (p2.y - p1.y) / (p2.x - p1.x);
  console.log(`(${p2.y}-${p1.y})/(${p2.x}-${p1.x}) = ${dydx}`);
  return dydx;
}

function calcIntegral(): number | null {
  const [p1, p2] = integralPoints;
  if (!p1 || !p2 || p1.x === p2.x) return null;
  return p1.y * (p2.x - p1.x);
}

function gridToCanvas(x: number, y: number): [number, number] {
  return [boxWidth * x + xAxis, yAxis - boxWidth * y];
}
