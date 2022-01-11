const updateDocumentProps = (updates, document, requestBody) => updates.forEach(update => document[update] = requestBody[update])

module.exports = updateDocumentProps