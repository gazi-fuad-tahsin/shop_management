export const rateLimiter = (requests = 100, windowMs = 15 * 60 * 1000) => {
  const store = new Map()

  return (req, res, next) => {
    const key = req.ip
    const now = Date.now()

    if (!store.has(key)) {
      store.set(key, [])
    }

    const timestamps = store.get(key).filter((time) => time > now - windowMs)
    store.set(key, timestamps)

    if (timestamps.length >= requests) {
      return res.status(429).json({ message: "Too many requests" })
    }

    timestamps.push(now)
    next()
  }
}
