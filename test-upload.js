const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    const form = new FormData();
    form.append('image', fs.createReadStream('./Uploads/1756544111301-0b0d87719dd290be0f266d172494722c.jpg'));

    try {
        const response = await axios.post('http://localhost:8000/api/auth/upload-image', form, {
            headers: form.getHeaders(),
        });
        console.log('Upload successful:', response.data);
    } catch (error) {
        console.error('Upload failed:', error.response ? error.response.data : error.message);
    }
}

testUpload();
