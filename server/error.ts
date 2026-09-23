import { sendRedirect } from 'h3'
import { defineNitroErrorHandler } from 'nitropack/runtime'

export default defineNitroErrorHandler((error, event) => {
  if (error.statusCode === 404 && error.fatal) {
    return sendRedirect(event, 'https://www.chekeys.com')
  }
})
