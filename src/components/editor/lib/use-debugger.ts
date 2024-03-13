import React from "react"

export enum DebugColor {
  blue = "bg-blue-500",
  red = "bg-red-500",
  green = "bg-green-500",
  yellow = "bg-yellow-500",
  purple = "bg-purple-500",
  pink = "bg-pink-500",
}

export const useDebugger = () => {
  const addVisualizer = React.useCallback(
    (rect: DOMRect, color: DebugColor = DebugColor.blue) => {
      const visualizer = document.createElement("div")
      visualizer.style.position = "absolute"
      visualizer.style.left = `${rect.x}px`
      visualizer.style.top = `${rect.y}px`
      visualizer.style.width = `${rect.width}px`
      visualizer.style.height = `${rect.height}px`
      visualizer.classList.add(color, "opacity-20", "z-50")
      visualizer.classList.add("visualizer")
      document.body.appendChild(visualizer)
    },
    [],
  )

  const addPointVisualizer = React.useCallback(
    (x: number, y: number, color: DebugColor = DebugColor.red) => {
      const visualizer = document.createElement("div")
      visualizer.style.position = "absolute"
      visualizer.style.left = `${x}px`
      visualizer.style.top = `${y}px`
      visualizer.style.width = `5px`
      visualizer.style.height = `5px`
      visualizer.classList.add(color)
      visualizer.classList.add("visualizer")
      document.body.appendChild(visualizer)
    },
    [],
  )

  const clearVisualizers = React.useCallback(() => {
    document.querySelectorAll(".visualizer").forEach((el) => el.remove())
  }, [])

  return { addVisualizer, addPointVisualizer, clearVisualizers }
}
