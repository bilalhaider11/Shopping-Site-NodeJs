const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if(err) {
            throw next(err);
        }
    });
}

exports.deleteFile = deleteFile;