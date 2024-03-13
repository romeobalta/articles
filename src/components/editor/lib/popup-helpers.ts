export const MODAL_OFFSET = 15

export function keepInsideViewport(
  modal: DOMRect,
  attachedTo: DOMRect,
  attachedAt: "top" | "bottom",
  offset: number = MODAL_OFFSET,
) {
  const WINDOW_PADDING = 10

  const { innerWidth, innerHeight } = window
  const { pageXOffset, pageYOffset } = window

  const { right, bottom, width, height } = modal

  let left = attachedTo.x + attachedTo.width / 2 - width / 2
  let top =
    attachedTo.y +
    (attachedAt === "top" ? -height - offset : attachedTo.height + offset) +
    pageYOffset

  if (left < WINDOW_PADDING + pageXOffset) {
    left = WINDOW_PADDING + pageXOffset
  } else if (right > innerWidth - WINDOW_PADDING + pageXOffset) {
    left = innerWidth - WINDOW_PADDING - width + pageXOffset
  }

  if (top < WINDOW_PADDING + pageYOffset) {
    top = WINDOW_PADDING + pageYOffset

    if (attachedTo) {
      top = attachedTo.bottom + pageYOffset + offset
    }
  } else if (bottom > innerHeight - WINDOW_PADDING + pageYOffset) {
    top = innerHeight - WINDOW_PADDING - height + pageYOffset

    if (attachedTo) {
      top = attachedTo.y - height - offset + pageYOffset
    }
  }

  return { left, top }
}
