"use client"

import { useEffect } from "react"
import { io } from "socket.io-client"

type PresenceSocketProps = {
  enabled?: boolean
}

export function PresenceSocket({ enabled = true }: PresenceSocketProps) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const token = localStorage.getItem("token")
    if (!token) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
    const socket = io(apiUrl, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    })

    let idleTimer: ReturnType<typeof setTimeout>
    const markActive = () => {
      socket.emit("presence:active")
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => socket.emit("presence:idle"), 5 * 60 * 1000)
    }
    const markIdle = () => socket.emit("presence:idle")
    const activityEvents = ["mousemove", "keydown", "pointerdown", "touchstart", "scroll"]

    socket.on("connect", markActive)
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    window.addEventListener("blur", markIdle)
    window.addEventListener("focus", markActive)
    markActive()

    return () => {
      clearTimeout(idleTimer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive))
      window.removeEventListener("blur", markIdle)
      window.removeEventListener("focus", markActive)
      socket.disconnect()
    }
  }, [enabled])

  return null
}
