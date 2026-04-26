export const uploadToImgBB = async (imageUri: string) => {
  const API_KEY = '7db9a93d18b242eae157c3ab94506ea6';
  
  try {
    // Create form data
    const formData = new FormData();
    
    // For React Native, we need to handle the URI correctly
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : `image`;

    // @ts-ignore
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    });

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      console.error('ImgBB Upload Error:', data);
      return null;
    }
  } catch (error) {
    console.error('Upload catch error:', error);
    return null;
  }
};
