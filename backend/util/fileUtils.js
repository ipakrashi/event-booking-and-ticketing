// backend/util/fileUtils.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Removes a file from backend/uploads safely.
 * Guards against deleting placeholder images or non-existent files.
 */
export const deleteFile = (relativeFilePath) => {
    if (!relativeFilePath || relativeFilePath.includes('placeholder')) {
        return
    }

    // posterImage.url is "/uploads/filename.ext" -> strip leading slash if needed
    const normalizedPath = relativeFilePath.startsWith('/')
        ? relativeFilePath.slice(1)
        : relativeFilePath

    const absolutePath = path.resolve(__dirname, '..', normalizedPath)

    fs.unlink(absolutePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error(
                `Failed to delete local file: ${absolutePath}`,
                err.message,
            )
        }
    })
}
