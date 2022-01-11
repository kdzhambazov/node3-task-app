const isValidOperation = (updates, allowedUpdates) => updates.every(update => allowedUpdates.includes(update))

module.exports = isValidOperation