"use client";

import { useEffect, useRef, type SubmitEvent } from "react";

import type { CartActionState } from "../action-state";
import styles from "./cart-add-motion.module.css";

const visitKey = "curly-joy:cart-delivery";
let showedDelivery = false;

function firstDelivery() {
  if (showedDelivery) return false;
  showedDelivery = true;
  try {
    if (sessionStorage.getItem(visitKey)) return false;
    sessionStorage.setItem(visitKey, "1");
  } catch {
    // The current page visit still works when storage is disabled.
  }
  return true;
}

type Origin = {
  photo: HTMLImageElement | null;
  url: string | null;
  button: ReturnType<typeof visibleCenter>;
  scrollY: number;
};

function visibleCenter(element: Element | null) {
  if (!element?.isConnected) return null;
  const rect = element.getBoundingClientRect();
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(rect.right, document.documentElement.clientWidth);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  if (right <= left || bottom <= top) return null;
  const x = (left + right) / 2;
  const y = (top + bottom) / 2;
  const hit = document.elementFromPoint(x, y);
  return element.contains(hit) ? { x, y } : null;
}

/** Keep the cart's confirmed count independent of this decorative feedback. */
export function useCartAddMotion(state: CartActionState) {
  const origin = useRef<Origin | null>(null);

  useEffect(() => {
    const submitted = origin.current;
    origin.current = null;
    if (state.status === "success" && submitted) return playDelivery(submitted);
  }, [state]);

  return (event: SubmitEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const photo = form.closest("article")?.querySelector<HTMLImageElement>("[data-product-thumbnail] img")
      ?? form.closest("[data-product-page]")?.querySelector<HTMLImageElement>("[data-gallery-photos] img")
      ?? null;
    origin.current = {
      photo,
      url: photo && photo.complete && photo.naturalWidth > 0 ? photo.currentSrc : null,
      button: visibleCenter(event.nativeEvent.submitter ?? form),
      scrollY: window.scrollY,
    };
  };
}

function playDelivery(origin: Origin) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cart = document.querySelector("[data-cart-delivery-target]");
  const icon = cart?.querySelector("svg");
  const end = visibleCenter(cart);
  if (!icon || !end || typeof icon.animate !== "function") return;

  const button = Math.abs(window.scrollY - origin.scrollY) < 48 ? origin.button : null;
  const start = visibleCenter(origin.photo) ?? button;
  const canFly = Boolean(origin.url && start && Math.hypot(start.x - end.x, start.y - end.y) > 60);
  const arrival = canFly ? 500 : 0;
  const first = firstDelivery();
  const scene = document.createElement("div");
  scene.className = styles.scene;
  scene.setAttribute("aria-hidden", "true");
  document.body.append(scene);
  const animations: Animation[] = [];

  function piece(className: string, x: number, y: number) {
    const item = document.createElement("div");
    item.className = className;
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    scene.append(item);
    return item;
  }

  if (canFly && start && origin.url) {
    const tile = piece(styles.tile, start.x, start.y);
    const photo = document.createElement("img");
    photo.src = origin.url;
    photo.alt = "";
    tile.append(photo);
    const x = end.x - start.x;
    const y = end.y - start.y;
    const lift = Math.min(68, Math.abs(x) * 0.15 + 12);
    const catchX = first ? 32 : 12;
    animations.push(tile.animate([
      { transform: "translate(0, 0) scale(.87)", opacity: 0 },
      { offset: 0.1, transform: `translate(${x * 0.06}px, ${y * 0.06 - 8}px) scale(1)`, opacity: 1 },
      { offset: 0.68, transform: `translate(${x * 0.79 - catchX}px, ${y * 0.79 - lift}px) rotate(-7deg) scale(.66)`, opacity: 1 },
      { offset: 0.82, transform: `translate(${x - catchX}px, ${y + 1}px) rotate(-4deg) scale(.46)`, opacity: 1 },
      { transform: `translate(${x}px, ${y}px) scale(.14)`, opacity: 0 },
    ], { duration: arrival, easing: "cubic-bezier(.38,.03,.32,1)", fill: "both" }));
  }

  animations.push(icon.animate([
    { scale: "1" },
    { offset: 0.42, scale: "1.16" },
    { scale: "1" },
  ], { delay: arrival - (canFly ? 30 : 0), duration: 230, easing: "ease-out" }));

  if (first) {
    const logo = cart?.closest("header")?.querySelector<HTMLImageElement>("[data-cart-mascot-source]");
    if (logo?.currentSrc) {
      const dog = piece(styles.poodle, end.x - 33, end.y + 13);
      dog.style.backgroundImage = `url("${logo.currentSrc}")`;
      animations.push(dog.animate([
        { transform: "translate(-12px, 10px) scale(.8)", opacity: 0 },
        { offset: 0.44, transform: "translate(-3px, 0) scale(1)", opacity: 1 },
        { offset: 0.72, transform: "translate(13px, -4px) scale(.92)", opacity: 1 },
        { transform: "translate(20px, 4px) scale(.78)", opacity: 0 },
      ], { delay: Math.max(0, arrival - 220), duration: 360, easing: "ease-out", fill: "both" }));
    }

    for (const [x, y] of [[-14, -14], [10, -8]]) {
      const spark = piece(styles.spark, end.x + x, end.y + y);
      animations.push(spark.animate([
        { transform: "scale(.25)", opacity: 0 },
        { offset: 0.36, transform: `translate(${x * 0.32}px, -3px) scale(1)`, opacity: 1 },
        { transform: `translate(${x * 0.62}px, -9px) scale(.55)`, opacity: 0 },
      ], { delay: canFly ? arrival - 14 : 180, duration: 290, easing: "ease-out", fill: "both" }));
    }
  }

  void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => scene.remove());
  return () => {
    for (const animation of animations) animation.cancel();
    scene.remove();
  };
}
