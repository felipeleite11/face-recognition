const multer = require('multer')
const multerS3 = require('multer-s3')
const { extname } = require('path')
const { randomUUID } = require('crypto')
const mimeTypes = require('node-mime-types')
const { S3Client } = require('@aws-sdk/client-s3')

const { getMIMEType } = mimeTypes

const deniedExtensions = ['.exe', '.bat', '.ps1', '.sh']

const minioClient = new S3Client({
	endpoint: process.env.STORAGE_ENDPOINT,
	forcePathStyle: true,
	region: process.env.STORAGE_REGION,
	credentials: {
		accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
		secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
	}
})

const minioStorage = multerS3({
    s3: minioClient,
    bucket: String(process.env.STORAGE_BUCKET),
    acl: 'public-read',
    key: (req, file, cb) => {
        let extension = extname(file.originalname)

        if(!extension) {
            const [_, ext] = file.mimetype?.split('/')
            extension = ext || ''
        }

        const fileName = `${randomUUID()}.${extension}`

        cb(null, fileName)
    },
    contentType: (req, file, callback) => {
        const mime = getMIMEType(file.originalname)

        return callback(null, mime)
    }
})

exports.uploadMinio = multer({
    storage: minioStorage,
    fileFilter: (req, file, callback) => {
        const extension = extname(file.originalname)

        if (deniedExtensions.includes(extension)) {
            return callback(new Error('Arquivo não permitido.'))
        }

        return callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024 * 30 // 30 mb file size
    }
})